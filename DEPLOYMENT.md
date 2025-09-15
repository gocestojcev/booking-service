# Deployment Guide

This guide covers deploying the Hotel Booking System to AWS.

## 🚀 Quick Deployment

### Option 1: Full Stack Deployment (Recommended)

```powershell
cd terraform/scripts
.\deploy-app.ps1
```

This script will:
- Deploy infrastructure with Terraform
- Build and deploy the backend to Lambda
- Build and deploy the frontend to S3 + CloudFront

### Option 2: Individual Component Deployment

#### Backend Only
```powershell
cd deployment
.\deploy-lambda.ps1
```

#### Frontend Only
```powershell
cd frontend
npm run build
aws s3 sync build/ s3://booking-system-frontend-675316576819/ --profile private
```

## 🔧 Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Terraform installed** (v1.0+)
3. **Node.js 18+** for frontend builds
4. **Python 3.9+** for backend builds

## 📋 Pre-deployment Checklist

- [ ] AWS credentials configured (`aws configure` or `aws configure --profile private`)
- [ ] Terraform initialized (`terraform init`)
- [ ] Environment variables updated in `.env` files
- [ ] All code committed and tested

## 🌐 Environment Variables

### Backend (.env)
```env
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_i66pYQHZR
COGNITO_APP_CLIENT_ID=7s5edv23i1rihuh83uvsif4ss1
DYNAMODB_TABLE_NAME=booking-system
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod
REACT_APP_AWS_REGION=eu-central-1
REACT_APP_USER_POOL_ID=eu-central-1_i66pYQHZR
REACT_APP_USER_POOL_WEB_CLIENT_ID=7s5edv23i1rihuh83uvsif4ss1
```

## 🏗️ Infrastructure Components

### DynamoDB
- **Table**: `booking-system`
- **Billing**: Pay-per-request
- **GSIs**: 5 Global Secondary Indexes for efficient queries

### Lambda
- **Function**: `booking-system-api`
- **Runtime**: Python 3.9
- **Memory**: 256MB
- **Timeout**: 15 seconds

### API Gateway
- **REST API**: `booking-system-api`
- **Stage**: `prod`
- **CORS**: Configured for CloudFront domain

### S3 + CloudFront
- **Bucket**: `booking-system-frontend-675316576819`
- **Distribution**: CloudFront for HTTPS
- **Website**: Static website hosting

### Cognito
- **User Pool**: `booking-system-users`
- **App Client**: `booking-system-web`
- **Domain**: Custom domain for hosted UI

## 🔍 Post-deployment Verification

1. **Health Check**: `https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod/health`
2. **Frontend**: `https://d250rdy15p5hge.cloudfront.net`
3. **Authentication**: Test login with Cognito
4. **API Calls**: Verify CORS and data loading

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Check API Gateway CORS configuration
- Verify CloudFront domain in allowed origins

**Lambda Import Errors**
- Verify package structure in deployment
- Check import paths in lambda_handler.py

**Authentication Issues**
- Verify Cognito configuration
- Check environment variables
- Test token validation

**Frontend Build Issues**
- Clear node_modules and reinstall
- Check environment variables
- Verify API URL configuration

### Logs

**Lambda Logs**
```bash
aws logs tail /aws/lambda/booking-system-api --follow --profile private
```

**CloudFront Logs**
- Check CloudWatch for distribution logs
- Verify S3 bucket permissions

## 🔄 Updates and Maintenance

### Code Updates
1. Make changes to source code
2. Test locally
3. Deploy using appropriate script
4. Verify deployment

### Infrastructure Updates
1. Update Terraform configurations
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes
4. Verify all services are working

### Database Updates
1. Update DynamoDB schema if needed
2. Test queries and performance
3. Update application code accordingly

## 📊 Monitoring

### CloudWatch Metrics
- Lambda invocations and errors
- API Gateway request counts
- DynamoDB read/write capacity
- CloudFront cache hit rates

### Alerts
- Set up CloudWatch alarms for:
  - Lambda errors
  - High API Gateway error rates
  - DynamoDB throttling
  - CloudFront error rates

## 🔒 Security

### IAM Roles
- Lambda execution role with minimal permissions
- S3 bucket policies for public read access
- Cognito user pool policies

### Network Security
- CloudFront for HTTPS termination
- API Gateway for request validation
- CORS configuration for cross-origin requests

### Data Protection
- DynamoDB encryption at rest
- JWT tokens for authentication
- Environment variables for sensitive data
