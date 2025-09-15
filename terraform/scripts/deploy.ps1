# Deploy Booking System Infrastructure
param(
    [string]$Action = "plan",
    [string]$Profile = "private",
    [string]$Region = "eu-central-1"
)

Write-Host "🚀 Booking System Infrastructure Deployment" -ForegroundColor Green
Write-Host "Action: $Action" -ForegroundColor Yellow
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Set AWS profile
$env:AWS_PROFILE = $Profile

# Change to terraform directory
Set-Location $PSScriptRoot\..

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Blue
terraform init

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform init failed" -ForegroundColor Red
    exit 1
}

# Validate configuration
Write-Host "🔍 Validating Terraform configuration..." -ForegroundColor Blue
terraform validate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform validation failed" -ForegroundColor Red
    exit 1
}

# Format code
Write-Host "🎨 Formatting Terraform code..." -ForegroundColor Blue
terraform fmt -recursive

# Execute action
switch ($Action.ToLower()) {
    "plan" {
        Write-Host "📋 Planning Terraform deployment..." -ForegroundColor Blue
        terraform plan -out=tfplan
    }
    "apply" {
        Write-Host "🚀 Applying Terraform configuration..." -ForegroundColor Blue
        terraform apply -auto-approve
    }
    "destroy" {
        Write-Host "💥 Destroying infrastructure..." -ForegroundColor Red
        Write-Host "⚠️  WARNING: This will delete all resources!" -ForegroundColor Yellow
        $confirm = Read-Host "Type 'yes' to confirm"
        if ($confirm -eq "yes") {
            terraform destroy -auto-approve
        } else {
            Write-Host "❌ Destruction cancelled" -ForegroundColor Yellow
        }
    }
    "output" {
        Write-Host "📤 Displaying Terraform outputs..." -ForegroundColor Blue
        terraform output
    }
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host "Valid actions: plan, apply, destroy, output" -ForegroundColor Yellow
        exit 1
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Terraform $Action failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Terraform $Action completed successfully!" -ForegroundColor Green

# Display outputs if apply was successful
if ($Action.ToLower() -eq "apply") {
    Write-Host ""
    Write-Host "📤 Infrastructure Outputs:" -ForegroundColor Green
    terraform output
}
