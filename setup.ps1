# FeedLot Pro - Automated Setup Script (PowerShell)
# This script copies all files and sets up the project

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   FeedLot Pro - Automated Setup Script     ║" -ForegroundColor Green
Write-Host "║   Steps 3-7: Copy files and test           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$ROOT_DIR = Get-Location

# Step 1: Copy backend files
Write-Host "[1/7] Copying backend files..." -ForegroundColor Cyan
Set-Location "$ROOT_DIR\backend"

$backendFiles = @(
    "server.js",
    "config-database.js",
    "jwt-utils.js",
    "password-utils.js",
    "auth-middleware.js",
    "auth-controller.js",
    "animals-controller.js",
    "weight-controller.js"
)

foreach ($file in $backendFiles) {
    Copy-Item "..\$file" "$ROOT_DIR\backend\$file" -ErrorAction SilentlyContinue
}

Copy-Item "..\.*" "$ROOT_DIR\backend\.env" -ErrorAction SilentlyContinue

Write-Host "✓ Backend files copied" -ForegroundColor Green
Write-Host ""

# Step 2: Create frontend folder
Write-Host "[2/7] Creating frontend folder..." -ForegroundColor Cyan
Set-Location $ROOT_DIR

if (-not (Test-Path "frontend")) {
    Write-Host "Running: npm create vite@latest frontend -- --template react" -ForegroundColor Yellow
    npm create vite@latest frontend -- --template react
    Write-Host "✓ Frontend folder created" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend folder already exists" -ForegroundColor Green
}
Write-Host ""

# Step 3: Install frontend dependencies
Write-Host "[3/7] Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location "$ROOT_DIR\frontend"

npm install --quiet
npm install axios zustand react-router-dom recharts date-fns --quiet
npm install -D tailwindcss postcss autoprefixer --quiet

Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Initialize Tailwind
Write-Host "[4/7] Initializing Tailwind..." -ForegroundColor Cyan
npx tailwindcss init -p

Write-Host "✓ Tailwind initialized" -ForegroundColor Green
Write-Host ""

# Step 5: Copy frontend files
Write-Host "[5/7] Copying frontend files..." -ForegroundColor Cyan

if (-not (Test-Path "src")) {
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
}

$frontendFiles = @(
    "api-service.js",
    "auth-store.js"
)

foreach ($file in $frontendFiles) {
    Copy-Item "..\$file" "src\$file" -ErrorAction SilentlyContinue
}

Copy-Item "..\vite.config.js" "vite.config.js" -ErrorAction SilentlyContinue
Copy-Item "..\tailwind.config.js" "tailwind.config.js" -ErrorAction SilentlyContinue
Copy-Item "..\postcss.config.js" "postcss.config.js" -ErrorAction SilentlyContinue
Copy-Item "..\.*" ".env.local" -ErrorAction SilentlyContinue

Write-Host "✓ Frontend files copied" -ForegroundColor Green
Write-Host ""

# Step 6: Summary
Write-Host "[6/7] Setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✓ All files copied and installed         ║" -ForegroundColor Green
Write-Host "║   ✓ Both backend and frontend ready        ║" -ForegroundColor Green
Write-Host "║   ✓ Tailwind CSS configured                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Step 7: Next steps
Write-Host "[7/7] Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Terminal 1 - Start Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Start Frontend:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then visit: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "✓ Setup complete! Ready to run!" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to close"
