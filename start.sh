#!/bin/bash
# Chạy cả backend + frontend. Dùng: ./start.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Khởi động Backend (port 8080)..."
cd "$ROOT/backend"
if [ ! -d venv ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi
uvicorn app.main:app --reload --port 8080 &
BACKEND_PID=$!

echo "▶ Khởi động Frontend (port 5173)..."
cd "$ROOT/frontend"
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Sẵn sàng!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://127.0.0.1:8080/api/health"
echo "   Đăng nhập: admin / admin1234"
echo ""
echo "Nhấn Ctrl+C để dừng cả hai."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
