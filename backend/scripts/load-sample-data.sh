#!/bin/bash

# Load sample data into the booking-system DynamoDB table
# This script reads from sample-data.json and loads all entities

echo "Loading sample data into booking-system table..."

# Function to put item into DynamoDB
put_item() {
    local item="$1"
    aws dynamodb put-item \
        --table-name booking-system \
        --item "$item" \
        --region eu-central-1
}

# Load Companies
echo "Loading companies..."
put_item '{
    "PK": {"S": "COMPANY#comp1"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Company"},
    "Name": {"S": "Мојата компанија"},
    "GSI1PK": {"S": "COMPANY#comp1"},
    "GSI1SK": {"S": "COMPANY#comp1"}
}'

# Load Locations
echo "Loading locations..."
put_item '{
    "PK": {"S": "LOCATION#loc1"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Location"},
    "Name": {"S": "Мојот Хотел 1"},
    "CompanyId": {"S": "comp1"},
    "GSI1PK": {"S": "COMPANY#comp1"},
    "GSI1SK": {"S": "LOCATION#loc1"}
}'

put_item '{
    "PK": {"S": "LOCATION#loc2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Location"},
    "Name": {"S": "Мојот Хотел 2"},
    "CompanyId": {"S": "comp1"},
    "GSI1PK": {"S": "COMPANY#comp1"},
    "GSI1SK": {"S": "LOCATION#loc2"}
}'

# Load Users
echo "Loading users..."
put_item '{
    "PK": {"S": "USER#user1"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "User"},
    "FirstName": {"S": "John"},
    "LastName": {"S": "Doe"},
    "EmailAddress": {"S": "john.doe@example.com"},
    "Password": {"S": "hashed_password_here"},
    "CompanyId": {"S": "comp1"},
    "GSI1PK": {"S": "COMPANY#comp1"},
    "GSI1SK": {"S": "USER#user1"}
}'

put_item '{
    "PK": {"S": "USER#user2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "User"},
    "FirstName": {"S": "Jane"},
    "LastName": {"S": "Smith"},
    "EmailAddress": {"S": "jane.smith@example.com"},
    "Password": {"S": "hashed_password_here"},
    "CompanyId": {"S": "comp1"},
    "GSI1PK": {"S": "COMPANY#comp1"},
    "GSI1SK": {"S": "USER#user2"}
}'

# Load Rooms
echo "Loading rooms..."
put_item '{
    "PK": {"S": "ROOM#room1"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Room"},
    "LocationId": {"S": "loc1"},
    "Type": {"S": "Standard"},
    "Number": {"S": "101"},
    "Note": {"S": "Ground floor room"},
    "IsActive": {"BOOL": true},
    "GSI2PK": {"S": "LOCATION#loc1"},
    "GSI2SK": {"S": "ROOM#room1"}
}'

put_item '{
    "PK": {"S": "ROOM#room2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Room"},
    "LocationId": {"S": "loc1"},
    "Type": {"S": "Deluxe"},
    "Number": {"S": "201"},
    "Note": {"S": "City view"},
    "IsActive": {"BOOL": true},
    "GSI2PK": {"S": "LOCATION#loc1"},
    "GSI2SK": {"S": "ROOM#room2"}
}'

put_item '{
    "PK": {"S": "ROOM#301_h2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Room"},
    "LocationId": {"S": "loc2"},
    "Type": {"S": "апп 2/4"},
    "Number": {"S": "301"},
    "Note": {"S": "Apartment for 2-4 people"},
    "IsActive": {"BOOL": true},
    "GSI2PK": {"S": "LOCATION#loc2"},
    "GSI2SK": {"S": "ROOM#301_h2"}
}'

put_item '{
    "PK": {"S": "ROOM#302_h2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Room"},
    "LocationId": {"S": "loc2"},
    "Type": {"S": "апп 2/4"},
    "Number": {"S": "302"},
    "Note": {"S": "Apartment for 2-4 people"},
    "IsActive": {"BOOL": true},
    "GSI2PK": {"S": "LOCATION#loc2"},
    "GSI2SK": {"S": "ROOM#302_h2"}
}'

# Load Reservations
echo "Loading reservations..."
put_item '{
    "PK": {"S": "RESERVATION#res1"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Reservation"},
    "RoomId": {"S": "room1"},
    "CheckInDate": {"S": "2024-01-15"},
    "CheckOutDate": {"S": "2024-01-18"},
    "Status": {"S": "Confirmed"},
    "RoomPrice": {"N": "150.00"},
    "TransportPrice": {"N": "25.00"},
    "Contact": {"S": "john.doe@example.com"},
    "SelfTransport": {"BOOL": false},
    "Agency": {"S": "Booking.com"},
    "Note": {"S": "Business trip"},
    "UserId": {"S": "user1"},
    "ModifiedBy": {"S": "user1"},
    "CreatedOn": {"S": "2024-01-10T10:00:00Z"},
    "ModifiedOn": {"S": "2024-01-10T10:00:00Z"},
    "IsDeleted": {"BOOL": false},
    "GSI3PK": {"S": "USER#user1"},
    "GSI3SK": {"S": "RESERVATION#res1"},
    "GSI4PK": {"S": "ROOM#room1"},
    "GSI4SK": {"S": "RESERVATION#res1"},
    "GSI5PK": {"S": "DATE#2024-01-15"},
    "GSI5SK": {"S": "RESERVATION#res1"}
}'

put_item '{
    "PK": {"S": "RESERVATION#res2"},
    "SK": {"S": "METADATA"},
    "EntityType": {"S": "Reservation"},
    "RoomId": {"S": "room2"},
    "CheckInDate": {"S": "2024-01-20"},
    "CheckOutDate": {"S": "2024-01-22"},
    "Status": {"S": "Pending"},
    "RoomPrice": {"N": "200.00"},
    "TransportPrice": {"N": "0.00"},
    "Contact": {"S": "jane.smith@example.com"},
    "SelfTransport": {"BOOL": true},
    "Agency": {"S": "Direct"},
    "Note": {"S": "Weekend getaway"},
    "UserId": {"S": "user2"},
    "ModifiedBy": {"S": "user2"},
    "CreatedOn": {"S": "2024-01-12T14:30:00Z"},
    "ModifiedOn": {"S": "2024-01-12T14:30:00Z"},
    "IsDeleted": {"BOOL": false},
    "GSI3PK": {"S": "USER#user2"},
    "GSI3SK": {"S": "RESERVATION#res2"},
    "GSI4PK": {"S": "ROOM#room2"},
    "GSI4SK": {"S": "RESERVATION#res2"},
    "GSI5PK": {"S": "DATE#2024-01-20"},
    "GSI5SK": {"S": "RESERVATION#res2"}
}'

# Load Reservation Persons
echo "Loading reservation persons..."
put_item '{
    "PK": {"S": "RESERVATION#res1"},
    "SK": {"S": "PERSON#person1"},
    "EntityType": {"S": "ReservationPerson"},
    "FirstName": {"S": "John"},
    "LastName": {"S": "Doe"}
}'

put_item '{
    "PK": {"S": "RESERVATION#res1"},
    "SK": {"S": "PERSON#person2"},
    "EntityType": {"S": "ReservationPerson"},
    "FirstName": {"S": "Mary"},
    "LastName": {"S": "Doe"}
}'

put_item '{
    "PK": {"S": "RESERVATION#res2"},
    "SK": {"S": "PERSON#person3"},
    "EntityType": {"S": "ReservationPerson"},
    "FirstName": {"S": "Jane"},
    "LastName": {"S": "Smith"}
}'

echo "Sample data loaded successfully!"
echo ""
echo "You can now query the data using these patterns:"
echo "1. Get all companies: aws dynamodb scan --table-name booking-system --filter-expression 'EntityType = :type' --expression-attribute-values '{':type':{'S':'Company'}}' --region eu-central-1"
echo "2. Get all rooms for a location: aws dynamodb query --table-name booking-system --index-name GSI2 --key-condition-expression 'GSI2PK = :pk' --expression-attribute-values '{':pk':{'S':'LOCATION#loc1'}}' --region eu-central-1"
echo "3. Get all reservations for a user: aws dynamodb query --table-name booking-system --index-name GSI3 --key-condition-expression 'GSI3PK = :pk' --expression-attribute-values '{':pk':{'S':'USER#user1'}}' --region eu-central-1"
