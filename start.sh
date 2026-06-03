#!/bin/bash
# CivilNobre - Script de inicialização

echo "=== CivilNobre - Diário de Obra Inteligente ==="
echo ""

# Start backend
echo "[1/2] Iniciando backend FastAPI na porta 8000..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

sleep 2

# Start frontend
echo "[2/2] Iniciando frontend React na porta 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"

echo ""
echo "=== App disponível em: http://localhost:5173 ==="
echo "=== API disponível em: http://localhost:8000/docs ==="
echo ""
echo "Pressione Ctrl+C para encerrar"

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" INT TERM
wait
