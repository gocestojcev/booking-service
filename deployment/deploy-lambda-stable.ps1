# Deploy Lambda function with stable dependencies
param(
    [string]$FunctionName = "booking-system-api",
    [string]$Profile = "private"
)

Write-Host "Deploying Lambda function: $FunctionName" -ForegroundColor Green

# Clean up previous deployment
if (Test-Path "lambda-package") {
    Remove-Item -Recurse -Force "lambda-package"
}

# Create deployment directory
New-Item -ItemType Directory -Path "lambda-package" -Force

Write-Host "Copying backend source code..." -ForegroundColor Blue
Copy-Item -Recurse -Path "../backend/src" -Destination "lambda-package/"

Write-Host "Copying lambda handler..." -ForegroundColor Blue
Copy-Item -Path "lambda_handler.py" -Destination "lambda-package/"

Write-Host "Installing Python dependencies..." -ForegroundColor Blue
Set-Location "lambda-package"

# Use the stable requirements file
Write-Host "Using stable requirements file..." -ForegroundColor Yellow
pip install -r ../requirements-stable.txt --target . --no-deps

# Install dependencies with their dependencies
Write-Host "Installing dependencies with their dependencies..." -ForegroundColor Yellow
pip install -r ../requirements-stable.txt --target .

Write-Host "Creating deployment package..." -ForegroundColor Blue
Compress-Archive -Path * -DestinationPath "../booking-system-api-deployment.zip" -Force

Write-Host "Deploying to AWS Lambda..." -ForegroundColor Blue
Set-Location ..

try {
    aws lambda update-function-code --function-name $FunctionName --zip-file fileb://booking-system-api-deployment.zip --profile $Profile
    Write-Host "Lambda deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error deploying Lambda function: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment completed!" -ForegroundColor Green
