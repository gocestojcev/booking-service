# AWS Cognito Setup Script
# This script creates a Cognito User Pool and App Client for the booking system

param(
    [string]$ProfileName = "default",
    [string]$Region = "us-east-1",
    [string]$UserPoolName = "booking-system-users",
    [string]$AppClientName = "booking-system-web"
)

Write-Host "🚀 Setting up AWS Cognito User Pool..." -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check if profile exists
try {
    aws sts get-caller-identity --profile $ProfileName | Out-Null
    Write-Host "✅ AWS profile '$ProfileName' is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS profile '$ProfileName' not found or invalid" -ForegroundColor Red
    Write-Host "Available profiles:" -ForegroundColor Yellow
    aws configure list-profiles
    exit 1
}

Write-Host "📋 Creating User Pool: $UserPoolName" -ForegroundColor Blue

# Create User Pool
$userPoolResponse = aws cognito-idp create-user-pool `
    --profile $ProfileName `
    --region $Region `
    --pool-name $UserPoolName `
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": true
        }
    }' `
    --username-attributes email `
    --auto-verified-attributes email `
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "EmailSubject": "Your verification code",
        "EmailMessage": "Your verification code is {####}"
    }' `
    --schema '[
        {
            "Name": "email",
            "AttributeDataType": "String",
            "Required": true,
            "Mutable": true
        },
        {
            "Name": "name",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true
        },
        {
            "Name": "company_id",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true,
            "DeveloperOnlyAttribute": false
        }
    ]' `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create User Pool" -ForegroundColor Red
    exit 1
}

$userPoolId = ($userPoolResponse | ConvertFrom-Json).UserPool.Id
Write-Host "✅ User Pool created: $userPoolId" -ForegroundColor Green

Write-Host "📱 Creating App Client: $AppClientName" -ForegroundColor Blue

# Create App Client
$appClientResponse = aws cognito-idp create-user-pool-client `
    --profile $ProfileName `
    --region $Region `
    --user-pool-id $userPoolId `
    --client-name $AppClientName `
    --no-generate-secret `
    --explicit-auth-flows USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH `
    --supported-identity-providers COGNITO `
    --callback-urls "http://localhost:3000" `
    --logout-urls "http://localhost:3000" `
    --allowed-o-auth-flows implicit `
    --allowed-o-auth-scopes email openid profile `
    --allowed-o-auth-flows-user-pool-client `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create App Client" -ForegroundColor Red
    exit 1
}

$appClientId = ($appClientResponse | ConvertFrom-Json).UserPoolClient.ClientId
Write-Host "✅ App Client created: $appClientId" -ForegroundColor Green

Write-Host "👤 Creating test user..." -ForegroundColor Blue

# Create test user
$testUserResponse = aws cognito-idp admin-create-user `
    --profile $ProfileName `
    --region $Region `
    --user-pool-id $userPoolId `
    --username "testuser" `
    --user-attributes Name=email,Value=test@example.com Name=name,Value="Test User" `
    --temporary-password "TempPass123!" `
    --message-action SUPPRESS

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to create test user (may already exist)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Test user created: testuser / TempPass123!" -ForegroundColor Green
}

# Generate environment files
Write-Host "📝 Generating environment files..." -ForegroundColor Blue

# Frontend .env file
$frontendEnv = @"
# AWS Cognito Configuration
REACT_APP_AWS_REGION=$Region
REACT_APP_USER_POOL_ID=$userPoolId
REACT_APP_USER_POOL_WEB_CLIENT_ID=$appClientId

# API Configuration
REACT_APP_API_ENDPOINT=http://localhost:8000
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "✅ Created frontend\.env" -ForegroundColor Green

# Backend environment file
$backendEnv = @"
# AWS Cognito Configuration
COGNITO_REGION=$Region
COGNITO_USER_POOL_ID=$userPoolId
"@

$backendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Created .env for backend" -ForegroundColor Green

# Display summary
Write-Host "`n🎉 Cognito Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "User Pool ID: $userPoolId" -ForegroundColor White
Write-Host "App Client ID: $appClientId" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Test User: testuser" -ForegroundColor White
Write-Host "Test Password: TempPass123!" -ForegroundColor White
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: python -m src.booking_system.api.v1.main" -ForegroundColor White
Write-Host "2. Start the frontend: cd frontend && npm start" -ForegroundColor White
Write-Host "3. Login with testuser / TempPass123!" -ForegroundColor White
Write-Host "`n🔧 Environment files created:" -ForegroundColor Yellow
Write-Host "- frontend\.env" -ForegroundColor White
Write-Host "- .env" -ForegroundColor White
