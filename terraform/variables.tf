variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "aws_profile" {
  description = "AWS profile to use"
  type        = string
  default     = "private"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "booking-system"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

# Cognito variables
variable "cognito_user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
  default     = "booking-system-user-pool"
}

variable "cognito_app_client_name" {
  description = "Name of the Cognito App Client"
  type        = string
  default     = "booking-system-app-client"
}

# DynamoDB variables
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "booking-system-table"
}

# Lambda variables
variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "booking-system-api"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.9"
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
}

# S3 variables
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for frontend"
  type        = string
  default     = "booking-system-frontend"
}

# API Gateway variables
variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "booking-system-api"
}
