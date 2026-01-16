package agent

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
)

func LoadOrCreateToken(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err == nil {
		t := strings.TrimSpace(string(b))
		if t != "" {
			return t, nil
		}
	}

	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := hex.EncodeToString(raw)

	if err := os.WriteFile(path, []byte(token+"\n"), 0o600); err != nil {
		return "", err
	}
	return token, nil
}

func CheckBearer(r *http.Request, token string) bool {
	h := r.Header.Get("Authorization")
	if h == "" {
		return false
	}
	const pfx = "Bearer "
	if !strings.HasPrefix(h, pfx) {
		return false
	}
	got := strings.TrimSpace(strings.TrimPrefix(h, pfx))
	return got == token
}
