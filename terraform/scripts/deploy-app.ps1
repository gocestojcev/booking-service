# Deploy Application (Frontend + Backend)
param(
    [string]$Profile = "private",
    [switch]$SkipInfrastructure = $false,
    [switch]$SkipBackend = $false,
    [switch]$SkipFrontend = $false
)

Write-Host "🚀 Booking System Application Deployment" -ForegroundColor Green
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Skip Infrastructure: $SkipInfrastructure" -ForegroundColor Yellow
Write-Host "Skip Backend: $SkipBackend" -ForegroundColor Yellow
Write-Host "Skip Frontend: $SkipFrontend" -ForegroundColor Yellow
Write-Host ""

# Set AWS profile
$env:AWS_PROFILE = $Profile

# Deploy Infrastructure
if (-not $SkipInfrastructure) {
    Write-Host "🏗️  Deploying Infrastructure..." -ForegroundColor Blue
    Set-Location $PSScriptRoot\..
    .\scripts\deploy.ps1 -Action "apply" -Profile $Profile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Infrastructure deployment failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green
}

# Setup Environment Variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Blue
.\scripts\setup-env.ps1 -Profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Environment setup failed" -ForegroundColor Red
    exit 1
}

# Deploy Backend
if (-not $SkipBackend) {
    Write-Host "🔧 Deploying Backend..." -ForegroundColor Blue
    Set-Location $PSScriptRoot\..\..\deployment
    .\deploy-lambda.ps1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend deployment failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
}

# Deploy Frontend
if (-not $SkipFrontend) {
    Write-Host "🎨 Deploying Frontend..." -ForegroundColor Blue
    Set-Location $PSScriptRoot\..\..\frontend
    
    # Build frontend
    Write-Host "📦 Building frontend..." -ForegroundColor Blue
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
    
    # Get S3 bucket name from Terraform
    Set-Location $PSScriptRoot\..
    $s3Bucket = (terraform output -raw s3_bucket_name)
    
    # Upload to S3
    Write-Host "☁️  Uploading to S3..." -ForegroundColor Blue
    Set-Location $PSScriptRoot\..\..\frontend
    aws s3 sync build/ "s3://$s3Bucket" --delete --profile $Profile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend upload failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
}

# Display final URLs
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot\..
$outputs = terraform output -json | ConvertFrom-Json

Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: $($outputs.s3_website_url.value)" -ForegroundColor White
Write-Host "  API: $($outputs.api_gateway_url.value)" -ForegroundColor White
Write-Host ""

Write-Host "🔐 Cognito Configuration:" -ForegroundColor Cyan
Write-Host "  User Pool ID: $($outputs.cognito_user_pool_id.value)" -ForegroundColor White
Write-Host "  App Client ID: $($outputs.cognito_app_client_id.value)" -ForegroundColor White
Write-Host ""

Write-Host "📊 AWS Resources:" -ForegroundColor Cyan
Write-Host "  DynamoDB Table: $($outputs.dynamodb_table_name.value)" -ForegroundColor White
Write-Host "  Lambda Function: $($outputs.lambda_function_name.value)" -ForegroundColor White
Write-Host "  S3 Bucket: $($outputs.s3_bucket_name.value)" -ForegroundColor White
