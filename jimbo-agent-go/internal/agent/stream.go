package agent

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// StreamHub implements a lightweight event bus + SSE broadcaster.
// Endpoint: GET /stream (text/event-stream)
// Events are emitted as JSON in SSE `data:` frames.

type StreamHub struct {
	mu      sync.Mutex
	clients map[chan []byte]struct{}
	ch      chan []byte
}

func NewStreamHub() *StreamHub {
	return &StreamHub{
		clients: make(map[chan []byte]struct{}),
		ch:      make(chan []byte, 256),
	}
}

func (h *StreamHub) Run() {
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg := <-h.ch:
				h.broadcast(msg)
			case <-ticker.C:
				h.Emit(map[string]any{"type": "heartbeat", "ts": time.Now().Unix()})
			}
		}
	}()
}

func (h *StreamHub) Emit(v any) {
	b, err := json.Marshal(v)
	if err != nil {
		return
	}
	select {
	case h.ch <- b:
	default:
		// drop when buffer full
	}
}

func (h *StreamHub) HandleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		WriteJSON(w, 500, map[string]any{"error": "streaming not supported"})
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	client := make(chan []byte, 64)

	h.mu.Lock()
	h.clients[client] = struct{}{}
	h.mu.Unlock()

	// initial hello
	fmt.Fprintf(w, "event: hello\n")
	fmt.Fprintf(w, "data: %s\n\n", `{"ok":true}`)
	flusher.Flush()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			h.mu.Lock()
			delete(h.clients, client)
			h.mu.Unlock()
			close(client)
			return
		case msg := <-client:
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		}
	}
}

func (h *StreamHub) broadcast(msg []byte) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		select {
		case c <- msg:
		default:
			// slow client; drop
		}
	}
}
