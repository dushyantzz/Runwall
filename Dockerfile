FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN adduser --disabled-password --gecos '' mcpuser \
    && chown -R mcpuser:mcpuser /app
USER mcpuser

# MODE selects which server to run:
#   "api"  -> FastAPI REST server on port 8000  (default)
#   "mcp"  -> FastMCP MCP server on port 8000
ENV MODE=mcp

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -sf http://localhost:8000/health || curl -sf http://localhost:8000/mcp || exit 1

# Shell form so $MODE is expanded at runtime
CMD if [ "$MODE" = "api" ]; then \
        uvicorn secure_mcp_server.api.app:app --host 0.0.0.0 --port 8000; \
    else \
        python -m secure_mcp_server.main; \
    fi