# Booking System Terraform Infrastructure

This Terraform configuration creates the complete AWS infrastructure for the Booking System application.

## Architecture

The infrastructure includes:

- **AWS Cognito**: User authentication and management
- **DynamoDB**: NoSQL database for storing booking data
- **AWS Lambda**: Serverless backend API
- **API Gateway**: REST API endpoint
- **S3**: Static website hosting for frontend
- **IAM**: Roles and policies for secure access

## Prerequisites

1. **Terraform**: Install Terraform >= 1.0
2. **AWS CLI**: Configured with appropriate credentials
3. **Python**: For Lambda function dependencies
4. **PowerShell**: For Windows deployment scripts

## Quick Start

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit terraform.tfvars with your values:**
   ```hcl
   aws_region  = "eu-central-1"
   aws_profile = "private"
   # ... other variables
   ```

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Resources Created

### Cognito
- User Pool with email verification
- App Client with OAuth configuration
- User Pool Domain

### DynamoDB
- Single-table design with 5 Global Secondary Indexes
- Pay-per-request billing
- Point-in-time recovery enabled

### Lambda
- Python 3.9 runtime
- 512MB memory, 30s timeout
- Environment variables for Cognito and DynamoDB

### API Gateway
- REST API with proxy integration
- CORS configuration
- Regional endpoint

### S3
- Static website hosting
- Public read access
- CORS configuration

### IAM
- Lambda execution role
- DynamoDB access policies
- Cognito access policies
- CloudWatch Logs permissions

## Outputs

After deployment, Terraform will output:

- **API Gateway URL**: Backend API endpoint
- **S3 Website URL**: Frontend website URL
- **Cognito Configuration**: User Pool ID, App Client ID
- **Environment Variables**: For frontend and backend configuration

## Environment Variables

### Frontend (.env)
```bash
REACT_APP_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_WEB_CLIENT_ID=your-app-client-id
REACT_APP_REGION=eu-central-1
```

### Backend (Lambda Environment)
```bash
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_APP_CLIENT_ID=your-app-client-id
DYNAMODB_TABLE_NAME=your-table-name
```

## Deployment Process

1. **Infrastructure**: Deploy with Terraform
2. **Backend**: Package and deploy Lambda function
3. **Frontend**: Build and upload to S3

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will delete all data in DynamoDB and S3!

## Security Notes

- Cognito User Pool is configured with strong password policies
- Lambda has minimal required permissions
- S3 bucket has public read access for static website hosting
- API Gateway has CORS enabled for frontend access

## Monitoring

- CloudWatch Logs for Lambda function
- DynamoDB metrics and alarms
- API Gateway metrics
- S3 access logs (if enabled)

## Troubleshooting

### Common Issues

1. **Lambda deployment fails**: Check Python dependencies in requirements.txt
2. **API Gateway CORS errors**: Verify CORS configuration
3. **Cognito authentication fails**: Check User Pool and App Client configuration
4. **DynamoDB access denied**: Verify IAM policies

### Useful Commands

```bash
# Check Terraform state
terraform show

# List all resources
terraform state list

# Import existing resources
terraform import aws_resource_type.resource_name resource_id

# Refresh state
terraform refresh
```

## Cost Optimization

- DynamoDB uses pay-per-request billing
- Lambda has 30-second timeout limit
- S3 uses standard storage class
- API Gateway has regional endpoint (cheaper than edge)

## Scaling

- DynamoDB auto-scales with pay-per-request
- Lambda scales automatically
- API Gateway handles up to 10,000 requests/second
- S3 has virtually unlimited storage

## Backup and Recovery

- DynamoDB point-in-time recovery enabled
- Lambda code is versioned in source control
- S3 versioning can be enabled if needed
- Terraform state should be stored in S3 backend
