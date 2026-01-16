#!/usr/bin/env python3
"""
JIMBO77 Ops API Server
Direct startup script
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from app.main import app

if __name__ == "__main__":
    # Use port 3885 for RAG API (reserved in config/ports.env)
    uvicorn.run(app, host="0.0.0.0", port=3885, reload=False)
