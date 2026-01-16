package agent

import (
	"net/http"
	"time"
)

func NetStatusHandler(w http.ResponseWriter, r *http.Request) {
	// v1: szybkie i pewne na Windows.
	// v2: można zastąpić WinAPI/WMI albo PowerShell Get-NetIPConfiguration.
	ip, ipErr, _ := RunCmd(5*time.Second, "ipconfig", "/all")
	route, rtErr, _ := RunCmd(5*time.Second, "route", "print")

	WriteJSON(w, 200, map[string]any{
		"ipconfig":      ip,
		"ipconfig_err":  ipErr,
		"route":         route,
		"route_err":     rtErr,
		"ts":            time.Now().Unix(),
	})
}

type PingReq struct {
	Host  string `json:"host"`
	Count int    `json:"count"`
}

func PingHandler(w http.ResponseWriter, r *http.Request) {
	var req PingReq
	if err := ReadJSON(r, &req); err != nil {
		WriteJSON(w, 400, map[string]any{"error": "bad json"})
		return
	}
	if req.Host == "" {
		WriteJSON(w, 400, map[string]any{"error": "host required"})
		return
	}
	if req.Count <= 0 || req.Count > 10 {
		req.Count = 4
	}

	out, errOut, err := RunCmd(10*time.Second, "ping", "-n", itoa(req.Count), req.Host)
	WriteJSON(w, 200, map[string]any{
		"stdout": out,
		"stderr": errOut,
		"error":  errString(err),
		"ts":     time.Now().Unix(),
	})
}

type TracertReq struct {
	Host string `json:"host"`
}

func TracertHandler(w http.ResponseWriter, r *http.Request) {
	var req TracertReq
	if err := ReadJSON(r, &req); err != nil {
		WriteJSON(w, 400, map[string]any{"error": "bad json"})
		return
	}
	if req.Host == "" {
		WriteJSON(w, 400, map[string]any{"error": "host required"})
		return
	}

	out, errOut, err := RunCmd(30*time.Second, "tracert", req.Host)
	WriteJSON(w, 200, map[string]any{
		"stdout": out,
		"stderr": errOut,
		"error":  errString(err),
		"ts":     time.Now().Unix(),
	})
}

func itoa(x int) string {
	if x == 0 {
		return "0"
	}
	neg := false
	if x < 0 {
		neg = true
		x = -x
	}
	var b [32]byte
	i := len(b)
	for x > 0 {
		i--
		b[i] = byte('0' + x%10)
		x /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
