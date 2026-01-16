package agent

import (
	"net/http"
	"os"
	"path/filepath"
	"time"
)

type Config struct {
	Addr           string
	DataDir        string
	AllowedOrigins []string
}

type Server struct {
	cfg    Config
	token  string
	stream *StreamHub
	tunnel *TunnelManager
}

func NewServer(cfg Config) (*Server, error) {
	if err := os.MkdirAll(cfg.DataDir, 0o755); err != nil {
		return nil, err
	}

	token, err := LoadOrCreateToken(filepath.Join(cfg.DataDir, "secret.txt"))
	if err != nil {
		return nil, err
	}

	// Create default config file if missing (includes cloudflared defaults)
	if err := EnsureDefaultRuntimeConfig(filepath.Join(cfg.DataDir, "config.json")); err != nil {
		return nil, err
	}

	hub := NewStreamHub()
	tm := NewTunnelManager(hub, filepath.Join(cfg.DataDir, "config.json"))

	s := &Server{
		cfg:    cfg,
		token:  token,
		stream: hub,
		tunnel: tm,
	}
	return s, nil
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		WriteJSON(w, 200, map[string]any{"ok": true, "ts": time.Now().Unix()})
	})

	// Stream (SSE) (auth)
	mux.Handle("/stream", s.cors(s.auth(http.HandlerFunc(s.stream.HandleSSE))))

	// Net
	mux.Handle("/net/status", s.cors(s.auth(http.HandlerFunc(NetStatusHandler))))
	mux.Handle("/net/ping", s.cors(s.auth(http.HandlerFunc(PingHandler))))
	mux.Handle("/net/tracert", s.cors(s.auth(http.HandlerFunc(TracertHandler))))

	// Firewall
	mux.Handle("/firewall/rules", s.cors(s.auth(http.HandlerFunc(FirewallListHandler))))
	mux.Handle("/firewall/rule/add", s.cors(s.auth(http.HandlerFunc(FirewallAddRuleHandler))))
	mux.Handle("/firewall/rule/remove", s.cors(s.auth(http.HandlerFunc(FirewallRemoveRuleHandler))))

	// Tunnel (cloudflared default)
	mux.Handle("/tunnel/start", s.cors(s.auth(http.HandlerFunc(s.tunnel.StartHandler))))
	mux.Handle("/tunnel/stop", s.cors(s.auth(http.HandlerFunc(s.tunnel.StopHandler))))
	mux.Handle("/tunnel/status", s.cors(s.auth(http.HandlerFunc(s.tunnel.StatusHandler))))
	mux.Handle("/tunnel/log-tail", s.cors(s.auth(http.HandlerFunc(s.tunnel.LogTailHandler))))

	return mux
}

func (s *Server) ListenAndServe() error {
	s.stream.Run()
	return http.ListenAndServe(s.cfg.Addr, s.routes())
}

func (s *Server) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if !CheckBearer(r, s.token) {
			WriteJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(s.cfg.AllowedOrigins))
	for _, o := range s.cfg.AllowedOrigins {
		allowed[o] = struct{}{}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
