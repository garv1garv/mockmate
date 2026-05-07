@echo off
echo Starting MockMate All-In-One Development Environment...
echo.

echo [1/3] Starting ML Service (Python/FastAPI) on port 8000...
start "MockMate - ML Service" cmd /c "cd ml_service && python -m uvicorn main:app --port 8000 --reload"

echo [2/3] Starting Backend (Node.js) on port 5000...
start "MockMate - Backend" cmd /c "cd backend && npm run dev"

echo [3/3] Starting Frontend (React/Vite) on port 5173...
start "MockMate - Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:5000
echo - ML Service: http://localhost:8000
echo.
echo Press any key to close this launcher window...
pause >nul
