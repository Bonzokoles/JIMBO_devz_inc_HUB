#!/bin/bash
# Start MoE-RAG API locally for development

echo ""
echo "🚀 Starting MoE-RAG API (Local Development)"
echo ""

# Create logs directory if needed
LOGS_DIR="../agents/logs"
if [ ! -d "$LOGS_DIR" ]; then
    echo "📁 Creating agents/logs directory..."
    mkdir -p "$LOGS_DIR"
    echo "✅ Directory created"
    echo ""
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found! Install Python 3.11+"
    exit 1
fi

echo "🐍 Python: $(python3 --version)"

# Check dependencies
echo "📦 Checking dependencies..."
MISSING_PACKAGES=()

for package in fastapi uvicorn sentence-transformers; do
    if ! python3 -c "import ${package//-/_}" 2>/dev/null; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "⚠️  Missing packages: ${MISSING_PACKAGES[*]}"
    echo "Installing missing packages..."
    pip3 install "${MISSING_PACKAGES[@]}" --quiet
    echo "✅ Dependencies installed"
fi

echo "✅ All dependencies installed"
echo ""

# Display server info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MoE-RAG API - Local Development Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📍 Server URL:      http://localhost:8001"
echo "  📚 API Docs:        http://localhost:8001/docs"
echo "  🔍 MoE-RAG Health:  http://localhost:8001/api/moe-rag/health"
echo "  🧪 MoE-RAG Debug:   http://localhost:8001/api/moe-rag/debug"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
python3 run.py
