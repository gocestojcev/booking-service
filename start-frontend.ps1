# Simple frontend startup script
Write-Host "Starting Frontend Server..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location "frontend"

# Start the development server
Write-Host "Starting React development server..." -ForegroundColor Blue
npm start
