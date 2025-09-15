#!/bin/bash

# AWS Cognito Setup Script
# This script creates a Cognito User Pool and App Client for the booking system

set -e

PROFILE_NAME=${1:-default}
REGION=${2:-us-east-1}
USER_POOL_NAME=${3:-booking-system-users}
APP_CLIENT_NAME=${4:-booking-system-web}

echo "🚀 Setting up AWS Cognito User Pool..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi
echo "✅ AWS CLI found"

# Check if profile exists
if ! aws sts get-caller-identity --profile $PROFILE_NAME &> /dev/null; then
    echo "❌ AWS profile '$PROFILE_NAME' not found or invalid"
    echo "Available profiles:"
    aws configure list-profiles
    exit 1
fi
echo "✅ AWS profile '$PROFILE_NAME' is valid"

echo "📋 Creating User Pool: $USER_POOL_NAME"

# Create User Pool
USER_POOL_RESPONSE=$(aws cognito-idp create-user-pool \
    --profile $PROFILE_NAME \
    --region $REGION \
    --pool-name $USER_POOL_NAME \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": true
        }
    }' \
    --username-attributes email \
    --auto-verified-attributes email \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "EmailSubject": "Your verification code",
        "EmailMessage": "Your verification code is {####}"
    }' \
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
    ]' \
    --output json)

USER_POOL_ID=$(echo $USER_POOL_RESPONSE | jq -r '.UserPool.Id')
echo "✅ User Pool created: $USER_POOL_ID"

echo "📱 Creating App Client: $APP_CLIENT_NAME"

# Create App Client
APP_CLIENT_RESPONSE=$(aws cognito-idp create-user-pool-client \
    --profile $PROFILE_NAME \
    --region $REGION \
    --user-pool-id $USER_POOL_ID \
    --client-name $APP_CLIENT_NAME \
    --no-generate-secret \
    --explicit-auth-flows USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --supported-identity-providers COGNITO \
    --callback-urls "http://localhost:3000" \
    --logout-urls "http://localhost:3000" \
    --allowed-o-auth-flows implicit \
    --allowed-o-auth-scopes email openid profile \
    --allowed-o-auth-flows-user-pool-client \
    --output json)

APP_CLIENT_ID=$(echo $APP_CLIENT_RESPONSE | jq -r '.UserPoolClient.ClientId')
echo "✅ App Client created: $APP_CLIENT_ID"

echo "👤 Creating test user..."

# Create test user
if aws cognito-idp admin-create-user \
    --profile $PROFILE_NAME \
    --region $REGION \
    --user-pool-id $USER_POOL_ID \
    --username "testuser" \
    --user-attributes Name=email,Value=test@example.com Name=name,Value="Test User" \
    --temporary-password "TempPass123!" \
    --message-action SUPPRESS &> /dev/null; then
    echo "✅ Test user created: testuser / TempPass123!"
else
    echo "⚠️  Failed to create test user (may already exist)"
fi

# Generate environment files
echo "📝 Generating environment files..."

# Frontend .env file
cat > frontend/.env << EOF
# AWS Cognito Configuration
REACT_APP_AWS_REGION=$REGION
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_USER_POOL_WEB_CLIENT_ID=$APP_CLIENT_ID

# API Configuration
REACT_APP_API_ENDPOINT=http://localhost:8000
EOF
echo "✅ Created frontend/.env"

# Backend environment file
cat > .env << EOF
# AWS Cognito Configuration
COGNITO_REGION=$REGION
COGNITO_USER_POOL_ID=$USER_POOL_ID
EOF
echo "✅ Created .env for backend"

# Display summary
echo ""
echo "🎉 Cognito Setup Complete!"
echo "================================"
echo "User Pool ID: $USER_POOL_ID"
echo "App Client ID: $APP_CLIENT_ID"
echo "Region: $REGION"
echo "Test User: testuser"
echo "Test Password: TempPass123!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend: python -m src.booking_system.api.v1.main"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Login with testuser / TempPass123!"
echo ""
echo "🔧 Environment files created:"
echo "- frontend/.env"
echo "- .env"
