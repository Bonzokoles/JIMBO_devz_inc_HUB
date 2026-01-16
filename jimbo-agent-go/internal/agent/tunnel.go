package agent

import (
	"bufio"
	"encoding/json"
	"net/http"
	"os/exec"
	"sync"
	"time"
)

type TunnelManager struct {
	mu      sync.Mutex
	cmd     *exec.Cmd
	running bool
	lastErr string
	hub     *StreamHub
	cfgPath string
	logBuf  *RingLog
}

func NewTunnelManager(hub *StreamHub, cfgPath string) *TunnelManager {
	cfg, _ := LoadRuntimeConfig(cfgPath)
	maxLines := cfg.LogTailLines
	if maxLines <= 0 {
		maxLines = 200
	}
	return &TunnelManager{hub: hub, cfgPath: cfgPath, logBuf: NewRingLog(maxLines)}
}

type TunnelStartReq struct {
	Args    []string `json:"args"`    // optional; if empty uses config.json defaultArgs
	BinPath string   `json:"binPath"` // optional; if empty uses config.json binPath
}

func (t *TunnelManager) StartHandler(w http.ResponseWriter, r *http.Request) {
	var req TunnelStartReq
	if r.ContentLength > 0 {
		if err := ReadJSON(r, &req); err != nil {
			WriteJSON(w, 400, map[string]any{"error": "bad json"})
			return
		}
	}

	cfg, err := LoadRuntimeConfig(t.cfgPath)
	if err != nil {
		WriteJSON(w, 500, map[string]any{"error": "cannot load config", "details": err.Error()})
		return
	}

	bin := req.BinPath
	if bin == "" {
		bin = cfg.Cloudflared.BinPath
		if bin == "" {
			bin = "cloudflared"
		}
	}
	args := req.Args
	if len(args) == 0 {
		args = cfg.Cloudflared.DefaultArgs
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	if t.running {
		WriteJSON(w, 409, map[string]any{"error": "tunnel already running"})
		return
	}

	cmd := exec.Command(bin, args...)
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		t.lastErr = err.Error()
		WriteJSON(w, 500, map[string]any{"error": t.lastErr})
		return
	}

	t.cmd = cmd
	t.running = true
	t.lastErr = ""
	t.logBuf.Clear()

	pid := 0
	if cmd.Process != nil {
		pid = cmd.Process.Pid
	}
	msg := map[string]any{"type": "tunnel", "event": "started", "pid": pid, "bin": bin, "args": args, "ts": time.Now().Unix()}
	t.hub.Emit(msg)
	t.logBuf.AddJSON(msg)

	go t.pipeLogs("stdout", stdout)
	go t.pipeLogs("stderr", stderr)

	go func() {
		err := cmd.Wait()
		t.mu.Lock()
		t.running = false
		if err != nil {
			t.lastErr = err.Error()
		}
		t.mu.Unlock()
		evt := map[string]any{"type": "tunnel", "event": "stopped", "error": errString(err), "ts": time.Now().Unix()}
		t.hub.Emit(evt)
		t.logBuf.AddJSON(evt)
	}()

	WriteJSON(w, 200, map[string]any{"ok": true, "pid": pid, "bin": bin, "args": args})
}

func (t *TunnelManager) StopHandler(w http.ResponseWriter, r *http.Request) {
	t.mu.Lock()
	defer t.mu.Unlock()

	if !t.running || t.cmd == nil || t.cmd.Process == nil {
		WriteJSON(w, 200, map[string]any{"ok": true, "note": "not running"})
		return
	}

	_ = t.cmd.Process.Kill()
	evt := map[string]any{"type": "tunnel", "event": "kill", "ts": time.Now().Unix()}
	t.hub.Emit(evt)
	t.logBuf.AddJSON(evt)
	WriteJSON(w, 200, map[string]any{"ok": true})
}

func (t *TunnelManager) StatusHandler(w http.ResponseWriter, r *http.Request) {
	t.mu.Lock()
	defer t.mu.Unlock()

	pid := 0
	if t.cmd != nil && t.cmd.Process != nil {
		pid = t.cmd.Process.Pid
	}

	WriteJSON(w, 200, map[string]any{
		"running": t.running,
		"pid":     pid,
		"lastErr": t.lastErr,
		"ts":      time.Now().Unix(),
	})
}

func (t *TunnelManager) LogTailHandler(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, 200, map[string]any{
		"lines": t.logBuf.Lines(),
		"ts":    time.Now().Unix(),
	})
}

func (t *TunnelManager) pipeLogs(kind string, rc interface{ Read([]byte) (int, error) }) {
	sc := bufio.NewScanner(rc)
	buf := make([]byte, 0, 64*1024)
	sc.Buffer(buf, 1024*1024)

	for sc.Scan() {
		line := sc.Text()
		payload := map[string]any{
			"type": "log",
			"src":  "cloudflared:" + kind,
			"line": line,
			"ts":   time.Now().Unix(),
		}
		t.hub.Emit(payload)
		t.logBuf.AddLine(line)
	}
	if err := sc.Err(); err != nil {
		payload := map[string]any{"type": "log", "src": "cloudflared:" + kind, "line": "scanner error: " + err.Error(), "ts": time.Now().Unix()}
		t.hub.Emit(payload)
		t.logBuf.AddLine(payload["line"].(string))
	}
}

// Ring buffer for last N log lines

type RingLog struct {
	mu    sync.Mutex
	max   int
	lines []string
}

func NewRingLog(max int) *RingLog {
	if max <= 0 {
		max = 200
	}
	return &RingLog{max: max, lines: make([]string, 0, max)}
}

func (r *RingLog) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.lines = r.lines[:0]
}

func (r *RingLog) AddLine(s string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if len(r.lines) >= r.max {
		copy(r.lines, r.lines[1:])
		r.lines[len(r.lines)-1] = s
		return
	}
	r.lines = append(r.lines, s)
}

func (r *RingLog) AddJSON(v any) {
	b, err := json.Marshal(v)
	if err != nil {
		return
	}
	r.AddLine(string(b))
}

func (r *RingLog) Lines() []string {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]string, len(r.lines))
	copy(out, r.lines)
	return out
}
