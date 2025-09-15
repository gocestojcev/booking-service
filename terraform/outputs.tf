# Cognito outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

# DynamoDB outputs
output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB Table ARN"
  value       = aws_dynamodb_table.main.arn
}

# Lambda outputs
output "lambda_function_name" {
  description = "Lambda Function Name"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.main.arn
}

# API Gateway outputs
output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_arn" {
  description = "API Gateway ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
}

# S3 outputs
output "s3_bucket_name" {
  description = "S3 Bucket Name"
  value       = aws_s3_bucket.frontend.bucket
}

output "s3_bucket_arn" {
  description = "S3 Bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "s3_website_url" {
  description = "S3 Website URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "cloudfront_url" {
  description = "CloudFront Distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

# Environment variables for frontend
output "frontend_env_vars" {
  description = "Environment variables for frontend"
  value = {
    REACT_APP_API_URL                    = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
    REACT_APP_USER_POOL_ID              = aws_cognito_user_pool.main.id
    REACT_APP_USER_POOL_WEB_CLIENT_ID   = aws_cognito_user_pool_client.main.id
    REACT_APP_REGION                    = data.aws_region.current.name
  }
}

# Environment variables for backend
output "backend_env_vars" {
  description = "Environment variables for backend"
  value = {
    COGNITO_REGION        = data.aws_region.current.name
    COGNITO_USER_POOL_ID  = aws_cognito_user_pool.main.id
    COGNITO_APP_CLIENT_ID = aws_cognito_user_pool_client.main.id
    DYNAMODB_TABLE_NAME   = aws_dynamodb_table.main.name
  }
}
