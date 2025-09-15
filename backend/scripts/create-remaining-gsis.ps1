# PowerShell script to create remaining GSIs for booking-system table

Write-Host "Creating remaining GSIs for booking-system table..."

# Function to wait for GSI to be active
function Wait-ForGSI {
    param($TableName, $GSIName, $Region, $Profile)
    
    do {
        $status = aws dynamodb describe-table --table-name $TableName --region $Region --profile $Profile --query "Table.GlobalSecondaryIndexes[?IndexName=='$GSIName'].IndexStatus" --output text
        Write-Host "GSI $GSIName status: $status"
        if ($status -ne "ACTIVE") {
            Start-Sleep -Seconds 30
        }
    } while ($status -ne "ACTIVE")
    Write-Host "GSI $GSIName is now ACTIVE"
}

# Create GSI3
Write-Host "Creating GSI3..."
$gsi3Config = @{
    "AttributeDefinitions" = @(
        @{
            "AttributeName" = "GSI3PK"
            "AttributeType" = "S"
        },
        @{
            "AttributeName" = "GSI3SK"
            "AttributeType" = "S"
        }
    )
    "GlobalSecondaryIndexUpdates" = @(
        @{
            "Create" = @{
                "IndexName" = "GSI3"
                "KeySchema" = @(
                    @{
                        "AttributeName" = "GSI3PK"
                        "KeyType" = "HASH"
                    },
                    @{
                        "AttributeName" = "GSI3SK"
                        "KeyType" = "RANGE"
                    }
                )
                "Projection" = @{
                    "ProjectionType" = "ALL"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$gsi3Config | Out-File -FilePath "gsi3-config.json" -Encoding UTF8
aws dynamodb update-table --table-name booking-system --cli-input-json file://gsi3-config.json --region eu-central-1 --profile private

Wait-ForGSI "booking-system" "GSI3" "eu-central-1" "private"

# Create GSI4
Write-Host "Creating GSI4..."
$gsi4Config = @{
    "AttributeDefinitions" = @(
        @{
            "AttributeName" = "GSI4PK"
            "AttributeType" = "S"
        },
        @{
            "AttributeName" = "GSI4SK"
            "AttributeType" = "S"
        }
    )
    "GlobalSecondaryIndexUpdates" = @(
        @{
            "Create" = @{
                "IndexName" = "GSI4"
                "KeySchema" = @(
                    @{
                        "AttributeName" = "GSI4PK"
                        "KeyType" = "HASH"
                    },
                    @{
                        "AttributeName" = "GSI4SK"
                        "KeyType" = "RANGE"
                    }
                )
                "Projection" = @{
                    "ProjectionType" = "ALL"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$gsi4Config | Out-File -FilePath "gsi4-config.json" -Encoding UTF8
aws dynamodb update-table --table-name booking-system --cli-input-json file://gsi4-config.json --region eu-central-1 --profile private

Wait-ForGSI "booking-system" "GSI4" "eu-central-1" "private"

# Create GSI5
Write-Host "Creating GSI5..."
$gsi5Config = @{
    "AttributeDefinitions" = @(
        @{
            "AttributeName" = "GSI5PK"
            "AttributeType" = "S"
        },
        @{
            "AttributeName" = "GSI5SK"
            "AttributeType" = "S"
        }
    )
    "GlobalSecondaryIndexUpdates" = @(
        @{
            "Create" = @{
                "IndexName" = "GSI5"
                "KeySchema" = @(
                    @{
                        "AttributeName" = "GSI5PK"
                        "KeyType" = "HASH"
                    },
                    @{
                        "AttributeName" = "GSI5SK"
                        "KeyType" = "RANGE"
                    }
                )
                "Projection" = @{
                    "ProjectionType" = "ALL"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$gsi5Config | Out-File -FilePath "gsi5-config.json" -Encoding UTF8
aws dynamodb update-table --table-name booking-system --cli-input-json file://gsi5-config.json --region eu-central-1 --profile private

Wait-ForGSI "booking-system" "GSI5" "eu-central-1" "private"

Write-Host "All GSIs created successfully!"
Write-Host "Final table status:"
aws dynamodb describe-table --table-name booking-system --region eu-central-1 --profile private --query "Table.GlobalSecondaryIndexes[].{IndexName:IndexName,Status:IndexStatus}"
