# Booking System - Complete Deployment Guide

This guide will walk you through deploying the entire Booking System infrastructure and application using Terraform.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   API Gateway   │    │   AWS Lambda    │
│   (S3 Hosted)   │◄───┤                 │◄───┤   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS Cognito   │    │   DynamoDB      │    │   CloudWatch    │
│   (Auth)        │    │   (Database)    │    │   (Logs)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Terraform** >= 1.0
- **AWS CLI** configured with credentials
- **Node.js** >= 16 (for frontend)
- **Python** >= 3.9 (for backend)
- **PowerShell** (Windows) or **Bash** (Linux/Mac)

### AWS Account Setup
1. Create an AWS account
2. Configure AWS CLI with your credentials
3. Ensure you have permissions to create:
   - IAM roles and policies
   - Lambda functions
   - API Gateway
   - DynamoDB tables
   - S3 buckets
   - Cognito User Pools

## 🚀 Quick Start (Automated)

### Option 1: Complete Deployment
```powershell
# Deploy everything at once
.\terraform\scripts\deploy-app.ps1 -Profile "private"
```

### Option 2: Step-by-Step Deployment
```powershell
# 1. Deploy infrastructure
.\terraform\scripts\deploy.ps1 -Action "apply" -Profile "private"

# 2. Setup environment variables
.\terraform\scripts\setup-env.ps1 -Profile "private"

# 3. Deploy backend
cd ..\deployment
.\deploy-lambda.ps1

# 4. Deploy frontend
cd ..\frontend
npm run build
aws s3 sync build/ s3://your-bucket-name --delete --profile private
```

## 🔧 Manual Deployment

### Step 1: Infrastructure Setup

1. **Initialize Terraform:**
   ```bash
   cd terraform
   terraform init
   ```

2. **Configure variables:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Plan deployment:**
   ```bash
   terraform plan
   ```

4. **Apply configuration:**
   ```bash
   terraform apply
   ```

### Step 2: Backend Deployment

1. **Package Lambda function:**
   ```bash
   cd ../deployment
   .\deploy-lambda.ps1
   ```

2. **Verify deployment:**
   ```bash
   aws lambda get-function --function-name booking-system-api --profile private
   ```

### Step 3: Frontend Deployment

1. **Build frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   # Get bucket name from Terraform output
   terraform output s3_bucket_name
   
   # Upload files
   aws s3 sync build/ s3://your-bucket-name --delete --profile private
   ```

### Step 4: Test Deployment

1. **Get application URLs:**
   ```bash
   terraform output
   ```

2. **Test frontend:**
   - Open the S3 website URL
   - Try logging in with a test user

3. **Test API:**
   - Check API Gateway URL
   - Verify Lambda function logs

## 🔐 User Management

### Create Test User

1. **Via AWS Console:**
   - Go to Cognito User Pools
   - Select your user pool
   - Create user with email and temporary password

2. **Via AWS CLI:**
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id YOUR_USER_POOL_ID \
     --username testuser \
     --user-attributes Name=email,Value=test@example.com \
     --temporary-password TempPass123! \
     --message-action SUPPRESS \
     --profile private
   ```

### Set Permanent Password

1. **Via Frontend:**
   - Login with temporary password
   - System will prompt for password change

2. **Via AWS CLI:**
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id YOUR_USER_POOL_ID \
     --username testuser \
     --password NewPassword123! \
     --permanent \
     --profile private
   ```

## 📊 Monitoring and Logs

### CloudWatch Logs
- **Lambda Logs:** `/aws/lambda/booking-system-api`
- **API Gateway Logs:** Available in API Gateway console

### DynamoDB Monitoring
- **Metrics:** Available in DynamoDB console
- **Alarms:** Can be set up for throttling, errors, etc.

### S3 Monitoring
- **Access Logs:** Can be enabled for detailed access tracking
- **Metrics:** Available in S3 console

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_WEB_CLIENT_ID=your-app-client-id
REACT_APP_REGION=eu-central-1
```

#### Backend (Lambda Environment)
```bash
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_APP_CLIENT_ID=your-app-client-id
DYNAMODB_TABLE_NAME=your-table-name
```

### Customization

#### Change AWS Region
1. Update `aws_region` in `terraform.tfvars`
2. Re-run `terraform apply`

#### Modify Lambda Configuration
1. Update variables in `terraform/variables.tf`
2. Re-run `terraform apply`

#### Change Cognito Settings
1. Modify `terraform/cognito.tf`
2. Re-run `terraform apply`

## 🧪 Testing

### API Testing
```bash
# Health check
curl https://your-api-gateway-url.execute-api.region.amazonaws.com/prod/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-api-gateway-url.execute-api.region.amazonaws.com/prod/hotels/
```

### Frontend Testing
1. Open the S3 website URL
2. Try to login with test user
3. Test booking functionality
4. Check browser console for errors

## 🚨 Troubleshooting

### Common Issues

#### 1. Terraform State Issues
```bash
# Refresh state
terraform refresh

# Import existing resources
terraform import aws_resource_type.resource_name resource_id
```

#### 2. Lambda Deployment Fails
- Check Python dependencies in `requirements.txt`
- Verify IAM permissions
- Check CloudWatch logs

#### 3. API Gateway CORS Errors
- Verify CORS configuration in `api_gateway.tf`
- Check frontend API URL configuration

#### 4. Cognito Authentication Issues
- Verify User Pool and App Client configuration
- Check callback URLs
- Verify JWT token expiration

#### 5. S3 Website Not Loading
- Check bucket policy
- Verify public access settings
- Check CORS configuration

### Debug Commands

```bash
# Check Terraform state
terraform show

# List all resources
terraform state list

# Get specific output
terraform output api_gateway_url

# Check AWS resources
aws lambda list-functions --profile private
aws s3 ls --profile private
aws cognito-idp list-user-pools --profile private
```

## 💰 Cost Optimization

### Current Costs (Estimated)
- **DynamoDB:** Pay-per-request (very low for development)
- **Lambda:** Pay-per-request (very low for development)
- **API Gateway:** Pay-per-request (very low for development)
- **S3:** Standard storage (very low for static files)
- **Cognito:** Free tier includes 50,000 MAUs

### Cost Optimization Tips
1. **DynamoDB:** Use pay-per-request for variable workloads
2. **Lambda:** Optimize memory allocation
3. **S3:** Use appropriate storage classes
4. **API Gateway:** Use regional endpoints (cheaper than edge)

## 🔄 Updates and Maintenance

### Updating Infrastructure
```bash
# Modify Terraform files
# Then apply changes
terraform plan
terraform apply
```

### Updating Application Code
```bash
# Backend
cd deployment
.\deploy-lambda.ps1

# Frontend
cd frontend
npm run build
aws s3 sync build/ s3://your-bucket-name --delete --profile private
```

### Backup and Recovery
- **DynamoDB:** Point-in-time recovery enabled
- **Lambda:** Code versioned in source control
- **Terraform State:** Should be stored in S3 backend

## 🗑️ Cleanup

### Destroy Everything
```bash
# Warning: This will delete all data!
terraform destroy
```

### Partial Cleanup
```bash
# Remove specific resources
terraform destroy -target=aws_s3_bucket.frontend
```

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Python Guide](https://docs.aws.amazon.com/lambda/latest/dg/python-programming-model.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Cognito User Pools Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Verify AWS permissions
4. Check Terraform state

For additional help, refer to the AWS documentation or Terraform documentation.
