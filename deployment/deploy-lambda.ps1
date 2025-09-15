# Deploy Lambda Function
param(
    [string]$FunctionName = "booking-system-api",
    [string]$RoleArn = "arn:aws:iam::675316576819:role/booking-system-lambda-role",
    [string]$Profile = "private"
)

Write-Host "Deploying Lambda function: $FunctionName" -ForegroundColor Yellow

# Create deployment package directory
$packageDir = "lambda-package"
if (Test-Path $packageDir) {
    Remove-Item -Recurse -Force $packageDir
}
New-Item -ItemType Directory -Path $packageDir -Force

# Copy backend source code
Write-Host "Copying backend source code..." -ForegroundColor Yellow
Copy-Item -Recurse -Path "../backend/src" -Destination "$packageDir/"

# Copy lambda handler
Write-Host "Copying lambda handler..." -ForegroundColor Yellow
Copy-Item -Path "lambda_handler.py" -Destination "$packageDir/"

# Install dependencies in the package directory
Set-Location $packageDir
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r ../requirements.txt -t . --no-deps
Set-Location ..

# Create deployment zip
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$zipFile = "$FunctionName-deployment.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create zip file
if (Test-Path $packageDir) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path (Get-Location) $packageDir), (Join-Path (Get-Location) $zipFile))
    Write-Host "Deployment package created: $zipFile" -ForegroundColor Green
} else {
    Write-Host "Package directory not found: $packageDir" -ForegroundColor Red
    exit 1
}

# Deploy to Lambda
if ($RoleArn) {
    Write-Host "Deploying to AWS Lambda..." -ForegroundColor Yellow
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.9 `
        --role $RoleArn `
        --handler lambda_handler.handler `
        --zip-file fileb://$zipFile `
        --timeout 30 `
        --memory-size 256 `
        --environment Variables="{COGNITO_REGION=eu-central-1,COGNITO_USER_POOL_ID=eu-central-1_S5hUULCnq,COGNITO_APP_CLIENT_ID=13lmf84vaqhujbblcr220dfgav}" `
        --profile $Profile
} else {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file fileb://$zipFile `
        --profile $Profile
}

Write-Host "Lambda deployment completed!" -ForegroundColor Green
