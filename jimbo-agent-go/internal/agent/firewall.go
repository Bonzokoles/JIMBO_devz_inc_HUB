package agent

import (
	"net/http"
	"time"
)

func FirewallListHandler(w http.ResponseWriter, r *http.Request) {
	out, errOut, err := RunCmd(20*time.Second, "netsh", "advfirewall", "firewall", "show", "rule", "name=all")
	WriteJSON(w, 200, map[string]any{
		"stdout": out,
		"stderr": errOut,
		"error": errString(err),
		"ts": time.Now().Unix(),
	})
}

type FirewallAddReq struct {
	Name       string `json:"name"`
	Dir        string `json:"dir"`       // in|out
	Action     string `json:"action"`    // allow|block
	Program    string `json:"program"`   // optional: full path
	Proto      string `json:"protocol"`  // TCP|UDP|ANY
	LocalPort  string `json:"localPort"` // optional
	RemotePort string `json:"remotePort"` // optional
}

func FirewallAddRuleHandler(w http.ResponseWriter, r *http.Request) {
	var req FirewallAddReq
	if err := ReadJSON(r, &req); err != nil {
		WriteJSON(w, 400, map[string]any{"error": "bad json"})
		return
	}
	if req.Name == "" {
		WriteJSON(w, 400, map[string]any{"error": "name required"})
		return
	}
	if req.Dir == "" {
		req.Dir = "out"
	}
	if req.Action == "" {
		req.Action = "block"
	}
	if req.Proto == "" {
		req.Proto = "ANY"
	}

	args := []string{"advfirewall", "firewall", "add", "rule", "name=" + req.Name, "dir=" + req.Dir, "action=" + req.Action, "protocol=" + req.Proto}
	if req.Program != "" {
		args = append(args, "program="+req.Program)
	}
	if req.LocalPort != "" {
		args = append(args, "localport="+req.LocalPort)
	}
	if req.RemotePort != "" {
		args = append(args, "remoteport="+req.RemotePort)
	}

	out, errOut, err := RunCmd(20*time.Second, "netsh", args...)
	WriteJSON(w, 200, map[string]any{
		"stdout": out,
		"stderr": errOut,
		"error": errString(err),
		"ts": time.Now().Unix(),
	})
}

type FirewallRemoveReq struct {
	Name string `json:"name"`
}

func FirewallRemoveRuleHandler(w http.ResponseWriter, r *http.Request) {
	var req FirewallRemoveReq
	if err := ReadJSON(r, &req); err != nil {
		WriteJSON(w, 400, map[string]any{"error": "bad json"})
		return
	}
	if req.Name == "" {
		WriteJSON(w, 400, map[string]any{"error": "name required"})
		return
	}
	out, errOut, err := RunCmd(20*time.Second, "netsh", "advfirewall", "firewall", "delete", "rule", "name="+req.Name)
	WriteJSON(w, 200, map[string]any{
		"stdout": out,
		"stderr": errOut,
		"error": errString(err),
		"ts": time.Now().Unix(),
	})
}
