#!/bin/bash

# Create DynamoDB table for booking system based on SQL schema
# This script creates a single-table design with 5 Global Secondary Indexes

echo "Creating DynamoDB table: booking-system"

aws dynamodb create-table \
    --table-name booking-system \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
        AttributeName=GSI3PK,AttributeType=S \
        AttributeName=GSI3SK,AttributeType=S \
        AttributeName=GSI4PK,AttributeType=S \
        AttributeName=GSI4SK,AttributeType=S \
        AttributeName=GSI5PK,AttributeType=S \
        AttributeName=GSI5SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        'IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=GSI3,KeySchema=[{AttributeName=GSI3PK,KeyType=HASH},{AttributeName=GSI3SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=GSI4,KeySchema=[{AttributeName=GSI4PK,KeyType=HASH},{AttributeName=GSI4SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        'IndexName=GSI5,KeySchema=[{AttributeName=GSI5PK,KeyType=HASH},{AttributeName=GSI5SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
    --billing-mode PROVISIONED \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region eu-central-1

echo "Waiting for table to be created..."
aws dynamodb wait table-exists --table-name booking-system --region eu-central-1

echo "Table 'booking-system' created successfully!"
echo "You can now use the table with the following access patterns:"
echo ""
echo "1. Get Company: PK=COMPANY#{company_id}, SK=METADATA"
echo "2. Get Location: PK=LOCATION#{location_id}, SK=METADATA"
echo "3. Get User: PK=USER#{user_id}, SK=METADATA"
echo "4. Get Room: PK=ROOM#{room_id}, SK=METADATA"
echo "5. Get Reservation: PK=RESERVATION#{reservation_id}, SK=METADATA"
echo "6. Get Reservation Persons: PK=RESERVATION#{reservation_id}, SK=PERSON#{person_id}"
echo ""
echo "GSI Access Patterns:"
echo "- GSI1: Get all entities for a company"
echo "- GSI2: Get all rooms for a location"
echo "- GSI3: Get all reservations for a user"
echo "- GSI4: Get all reservations for a room"
echo "- GSI5: Get reservations by date"
