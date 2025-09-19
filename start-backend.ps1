# Simple backend startup script
Write-Host "Starting Backend Server..." -ForegroundColor Green

# Navigate to backend directory
Set-Location "backend"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Blue
& ".\venv312\Scripts\Activate.ps1"

# Set Python path
$env:PYTHONPATH = ".\src"

# Start the server
Write-Host "Starting uvicorn server..." -ForegroundColor Blue
python -m uvicorn booking_system.api.v1.main:app --reload --host 0.0.0.0 --port 8000
