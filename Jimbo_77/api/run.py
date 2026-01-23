#!/usr/bin/env python3
"""
JIMBO77 Ops API Server
Direct startup script
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file (Task 1.3)
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    # Use port from .env or default to 8001 (FAZA 1 Task 1.1)
    port = int(os.getenv("API_PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
