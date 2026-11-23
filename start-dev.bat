@echo off
title Trading Journey Localhost Server
echo ========================================================
echo  Starting Trading Journey (Fullstack Localhost)
echo  Backend API : http://127.0.0.1:8000
echo  Frontend App: http://localhost:5301
echo ========================================================
echo.

start "Trading Journey Backend (Laravel 13)" cmd /c "cd /d %~dp0backend && php artisan serve --host=127.0.0.1 --port=8000"
timeout /t 2 /nobreak >nul
start "Trading Journey Frontend (React 19)" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo Browser will open at http://localhost:5301
timeout /t 3 /nobreak >nul
start http://localhost:5301
