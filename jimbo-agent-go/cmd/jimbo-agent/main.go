package main

import (
	"log"
	"os"
	"path/filepath"

	"jimbo-agent/internal/agent"
)

func main() {
	// Runtime dir:
	// - dev: set JIMBO_DATA_DIR
	// - prod: defaults to %ProgramData%\\JimboAgent
	dataDir := os.Getenv("JIMBO_DATA_DIR")
	if dataDir == "" {
		progData := os.Getenv("ProgramData")
		if progData == "" {
			progData = `C:\\ProgramData`
		}
		dataDir = filepath.Join(progData, "JimboAgent")
	}

	cfg := agent.Config{
		Addr: "127.0.0.1:8787",
		DataDir: dataDir,
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:4173",
			"http://127.0.0.1:4173",
		},
	}

	s, err := agent.NewServer(cfg)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("JimboAgent listening on", cfg.Addr)
	log.Println("DataDir:", cfg.DataDir)
	if err := s.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
