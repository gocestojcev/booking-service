# Local Development Setup Guide

## Current Status ✅

**Backend (FastAPI):**
- ✅ Module path: `booking_system.api.v1.main:app`
- ✅ Port: 8000
- ✅ CORS configured for localhost:3000
- ✅ Authentication enabled with Cognito
- ✅ Environment variables loaded with `load_dotenv()`

**Frontend (React):**
- ✅ Port: 3000
- ✅ API URL auto-detection: localhost:8000 for development
- ✅ Cognito configuration with fallback values
- ✅ Authentication working

## Required Environment Variables

### Backend (.env file needed in `backend/` directory)
```bash
# AWS Configuration
AWS_REGION=eu-central-1
AWS_DEFAULT_REGION=eu-central-1

# Cognito Configuration
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_i66pYQHZR

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=booking-system

# Development Settings
DEBUG=True
LOG_LEVEL=INFO
```

### Frontend (.env file needed in `frontend/` directory)
```bash
# AWS Cognito Configuration
REACT_APP_AWS_REGION=eu-central-1
REACT_APP_USER_POOL_ID=eu-central-1_i66pYQHZR
REACT_APP_USER_POOL_WEB_CLIENT_ID=7s5edv23i1rihuh83uvsif4ss1

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

## How to Start Locally

### Option 1: Start Both Services (Recommended)
```bash
npm run startall
```

### Option 2: Start Services Separately
```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend  
npm run start:frontend
```

## Current Configuration Analysis

### Backend Configuration
- **Environment Variables**: Uses `os.getenv()` with defaults
- **Cognito**: Falls back to hardcoded values if env vars not set
- **CORS**: Allows localhost:3000, S3, and CloudFront URLs
- **Authentication**: Enabled by default (no bypass for local dev)

### Frontend Configuration
- **API URL**: Auto-detects based on NODE_ENV
- **Cognito**: Uses hardcoded fallback values
- **Environment**: Checks for REACT_APP_* variables

## What You Need to Do

1. **Create backend/.env file** with the environment variables above
2. **Create frontend/.env file** with the environment variables above
3. **Run `npm run startall`** to start both services

## No Changes Needed for Deployment

The current setup automatically handles:
- ✅ Local development (localhost URLs)
- ✅ Production deployment (AWS URLs)
- ✅ Environment variable fallbacks
- ✅ CORS configuration for both environments

## Troubleshooting

If you get authentication errors:
1. Check that your AWS credentials are configured
2. Verify the Cognito User Pool ID is correct
3. Ensure the DynamoDB table exists and is accessible

If you get CORS errors:
1. Check that the frontend is running on port 3000
2. Verify the backend is running on port 8000
3. Check the CORS configuration in main.py
