# Setup Environment Variables for Frontend and Backend
param(
    [string]$Profile = "private"
)

Write-Host "🔧 Setting up environment variables..." -ForegroundColor Green

# Set AWS profile
$env:AWS_PROFILE = $Profile

# Change to terraform directory
Set-Location $PSScriptRoot\..

# Get Terraform outputs
Write-Host "📤 Getting Terraform outputs..." -ForegroundColor Blue
$outputs = terraform output -json | ConvertFrom-Json

# Frontend environment variables
$frontendEnv = @{
    REACT_APP_API_URL                  = $outputs.api_gateway_url.value
    REACT_APP_USER_POOL_ID            = $outputs.cognito_user_pool_id.value
    REACT_APP_USER_POOL_WEB_CLIENT_ID = $outputs.cognito_app_client_id.value
    REACT_APP_REGION                  = "eu-central-1"
}

# Backend environment variables
$backendEnv = @{
    COGNITO_REGION        = "eu-central-1"
    COGNITO_USER_POOL_ID  = $outputs.cognito_user_pool_id.value
    COGNITO_APP_CLIENT_ID = $outputs.cognito_app_client_id.value
    DYNAMODB_TABLE_NAME   = $outputs.dynamodb_table_name.value
}

# Create frontend .env file
Write-Host "📝 Creating frontend .env file..." -ForegroundColor Blue
$frontendEnvContent = @()
foreach ($key in $frontendEnv.Keys) {
    $frontendEnvContent += "$key=$($frontendEnv[$key])"
}
$frontendEnvContent | Out-File -FilePath "../frontend/.env" -Encoding UTF8

# Create frontend .env.production file
Write-Host "📝 Creating frontend .env.production file..." -ForegroundColor Blue
$frontendEnvContent | Out-File -FilePath "../frontend/.env.production" -Encoding UTF8

# Create backend .env file
Write-Host "📝 Creating backend .env file..." -ForegroundColor Blue
$backendEnvContent = @()
foreach ($key in $backendEnv.Keys) {
    $backendEnvContent += "$key=$($backendEnv[$key])"
}
$backendEnvContent | Out-File -FilePath "../backend/.env" -Encoding UTF8

# Display the created environment variables
Write-Host ""
Write-Host "✅ Environment variables created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend .env:" -ForegroundColor Yellow
$frontendEnvContent | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""
Write-Host "Backend .env:" -ForegroundColor Yellow
$backendEnvContent | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""
Write-Host "🌐 Frontend URL: $($outputs.s3_website_url.value)" -ForegroundColor Cyan
Write-Host "🔗 API URL: $($outputs.api_gateway_url.value)" -ForegroundColor Cyan
