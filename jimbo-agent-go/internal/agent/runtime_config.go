package agent

import (
	"encoding/json"
	"os"
)

type RuntimeConfig struct {
	Cloudflared struct {
		BinPath    string   `json:"binPath"`
		DefaultArgs []string `json:"defaultArgs"`
	} `json:"cloudflared"`
	LogTailLines int `json:"logTailLines"`
}

func DefaultRuntimeConfig() RuntimeConfig {
	var c RuntimeConfig
	c.Cloudflared.BinPath = "cloudflared"
	c.Cloudflared.DefaultArgs = []string{"tunnel", "--no-autoupdate", "run", "<TUNNEL_NAME>"}
	c.LogTailLines = 200
	return c
}

func EnsureDefaultRuntimeConfig(path string) error {
	if _, err := os.Stat(path); err == nil {
		return nil
	}
	cfg := DefaultRuntimeConfig()
	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o600)
}

func LoadRuntimeConfig(path string) (RuntimeConfig, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return RuntimeConfig{}, err
	}
	var cfg RuntimeConfig
	if err := json.Unmarshal(b, &cfg); err != nil {
		return RuntimeConfig{}, err
	}
	if cfg.Cloudflared.BinPath == "" {
		cfg.Cloudflared.BinPath = "cloudflared"
	}
	if len(cfg.Cloudflared.DefaultArgs) == 0 {
		cfg.Cloudflared.DefaultArgs = DefaultRuntimeConfig().Cloudflared.DefaultArgs
	}
	if cfg.LogTailLines <= 0 {
		cfg.LogTailLines = 200
	}
	return cfg, nil
}
