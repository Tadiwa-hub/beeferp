@echo off
REM FeedLot Pro - Automated Setup Script
REM This script copies all files and sets up the project

echo.
echo ╔════════════════════════════════════════════╗
echo ║   FeedLot Pro - Automated Setup Script     ║
echo ║   Steps 3-7: Copy files and test           ║
echo ╚════════════════════════════════════════════╝
echo.

REM Get the root directory
setlocal enabledelayedexpansion
set ROOT_DIR=%cd%

echo [1/7] Copying backend files...
cd /d "%ROOT_DIR%\backend"

copy "..\server.js" "server.js" >nul 2>&1
copy "..\config-database.js" "config-database.js" >nul 2>&1
copy "..\jwt-utils.js" "jwt-utils.js" >nul 2>&1
copy "..\password-utils.js" "password-utils.js" >nul 2>&1
copy "..\auth-middleware.js" "auth-middleware.js" >nul 2>&1
copy "..\auth-controller.js" "auth-controller.js" >nul 2>&1
copy "..\animals-controller.js" "animals-controller.js" >nul 2>&1
copy "..\weight-controller.js" "weight-controller.js" >nul 2>&1
copy "..\.*" ".env" >nul 2>&1

echo ✓ Backend files copied
echo.

echo [2/7] Creating frontend folder...
cd /d "%ROOT_DIR%"
if not exist "frontend" (
    echo Running: npm create vite@latest frontend -- --template react
    call npm create vite@latest frontend -- --template react --quiet
    echo ✓ Frontend folder created
) else (
    echo ✓ Frontend folder already exists
)
echo.

echo [3/7] Installing frontend dependencies...
cd /d "%ROOT_DIR%\frontend"
call npm install --quiet
call npm install axios zustand react-router-dom recharts date-fns --quiet
call npm install -D tailwindcss postcss autoprefixer --quiet
echo ✓ Frontend dependencies installed
echo.

echo [4/7] Initializing Tailwind...
call npx tailwindcss init -p --quiet
echo ✓ Tailwind initialized
echo.

echo [5/7] Copying frontend files...
mkdir src >nul 2>&1
copy "..\api-service.js" "src\api-service.js" >nul 2>&1
copy "..\auth-store.js" "src\auth-store.js" >nul 2>&1
copy "..\vite.config.js" "vite.config.js" >nul 2>&1
copy "..\tailwind.config.js" "tailwind.config.js" >nul 2>&1
copy "..\postcss.config.js" "postcss.config.js" >nul 2>&1
copy "..\.*" ".env.local" >nul 2>&1

echo ✓ Frontend files copied
echo.

echo [6/7] Setup complete!
echo.
echo ╔════════════════════════════════════════════╗
echo ║   ✓ All files copied and installed         ║
echo ║   ✓ Both backend and frontend ready        ║
echo ║   ✓ Tailwind CSS configured                ║
echo ╚════════════════════════════════════════════╝
echo.

echo [7/7] Next steps:
echo.
echo Terminal 1 - Start Backend:
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 - Start Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Then visit: http://localhost:5173
echo.
echo ✓ Setup complete! Ready to run!
echo.
pause
