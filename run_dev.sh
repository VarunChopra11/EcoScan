#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🌱 Starting EcoScan Full-Stack Environment..."

cleanup() {
    echo ""
    echo "Shutting down EcoScan servers..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT SIGINT SIGTERM

# 1. Start Backend
echo "Starting Backend (FastAPI on http://localhost:8000)..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "Setting up backend virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r requirements.txt
fi
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend health
sleep 2

# 2. Start Frontend
echo "Starting Frontend (Vite on http://localhost:5173)..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 EcoScan is ready!"
echo "👉 Frontend: http://localhost:5173"
echo "👉 Backend API Docs: http://localhost:8000/docs"
echo "Press Ctrl+C to terminate both servers."
echo ""

wait
