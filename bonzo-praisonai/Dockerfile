FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY shared/ ./shared/
COPY agents/ ./agents/
COPY config/ ./config/
COPY dashboard/ ./dashboard/

# Create directories for runtime
RUN mkdir -p /app/logs

# Non-root user for security
RUN useradd -m -u 1000 bonzo && \
    chown -R bonzo:bonzo /app
USER bonzo

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:${PORT:-6002}/health')" || exit 1

# Default command (overridden in docker-compose)
CMD ["python", "agents/cost_optimizer.py"]
