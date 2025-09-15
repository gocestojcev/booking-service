# Lambda function
resource "aws_lambda_function" "main" {
  filename         = "../deployment/booking-system-api-deployment.zip"
  function_name    = var.lambda_function_name
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda_handler.handler"
  source_code_hash = filebase64sha256("../deployment/booking-system-api-deployment.zip")
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_REGION         = data.aws_region.current.name
      COGNITO_USER_POOL_ID   = aws_cognito_user_pool.main.id
      COGNITO_APP_CLIENT_ID  = aws_cognito_user_pool_client.main.id
      DYNAMODB_TABLE_NAME    = aws_dynamodb_table.main.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs,
  ]

  tags = local.common_tags
}

# Note: The zip file is created by null_resource.build_lambda_package

# Build Lambda package
resource "null_resource" "build_lambda_package" {
  provisioner "local-exec" {
    command = <<-EOT
      cd ../deployment
      if (Test-Path "lambda-package") { Remove-Item -Recurse -Force "lambda-package" }
      New-Item -ItemType Directory -Path "lambda-package"
      Copy-Item -Recurse "../backend/src" -Destination "lambda-package/"
      Copy-Item "lambda_handler.py" -Destination "lambda-package/"
      Copy-Item "requirements.txt" -Destination "lambda-package/"
      pip install -r requirements.txt -t lambda-package/
      Compress-Archive -Path "lambda-package/*" -DestinationPath "booking-system-api-deployment.zip" -Force
    EOT
    interpreter = ["PowerShell", "-Command"]
  }

  triggers = {
    always_run = timestamp()
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = 14

  tags = local.common_tags
  
  lifecycle {
    ignore_changes = [name]
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
