# Development Environment Setup Script
# Run this script to set up the development environment

Write-Host "🏗️ Setting up Hotel Booking System Development Environment" -ForegroundColor Blue

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI" -ForegroundColor Red
    exit 1
}

# Check Terraform
try {
    $terraformVersion = terraform --version
    Write-Host "✅ Terraform: $terraformVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform not found. Please install Terraform" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

# Install backend dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Blue
Set-Location backend
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Blue
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "`n✅ Development environment setup complete!" -ForegroundColor Green
Write-Host "`n🚀 To start development:" -ForegroundColor Blue
Write-Host "  Backend:  cd backend && python -m uvicorn src.booking_system.api.v1.main:app --reload" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "`n📚 See README.md for more information" -ForegroundColor Blue
