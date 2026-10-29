#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment with Python 3.12..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi

echo "Starting EcoScan FastAPI backend on http://0.0.0.0:8000..."
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
