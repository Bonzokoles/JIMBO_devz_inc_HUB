#!/usr/bin/env python3
"""
JIMBO77 API Quick Start
Uruchamianie API z właściwymi ścieżkami
"""

import os
import sys

# Dodaj ścieżki
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

os.environ['PYTHONPATH'] = current_dir

print(f"🚀 Starting JIMBO77 API from: {current_dir}")
print(f"📂 Python path: {sys.path[0]}")

try:
    import uvicorn
    from app.main import app
    
    print("✅ Modules imported successfully")
    print("🌐 Starting server on http://localhost:8002")
    
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=False)
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Run: pip install uvicorn fastapi asyncpg sqlalchemy")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)