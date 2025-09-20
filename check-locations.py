#!/usr/bin/env python3
import boto3

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

# Get all locations (hotels)
response = table.scan(
    FilterExpression="EntityType = :entity_type",
    ExpressionAttributeValues={
        ":entity_type": "Location"
    }
)

locations = response.get('Items', [])
print("Available locations (hotels):")
for location in locations:
    print(f"  PK: {location['PK']}")
    print(f"  Name: {location.get('Name', 'N/A')}")
    print(f"  CompanyId: {location.get('CompanyId', 'N/A')}")
    print()

# Test deleted reservations for each location
for location in locations:
    location_pk = location['PK']
    location_id = location_pk.replace('LOCATION#', '') if location_pk.startswith('LOCATION#') else location_pk
    
    print(f"Testing deleted reservations for location {location_id} (PK: {location_pk})")
    
    response = table.scan(
        FilterExpression='EntityType = :entity_type AND HotelId = :hotel_id AND IsDeleted = :is_deleted',
        ExpressionAttributeValues={
            ':entity_type': 'Reservation',
            ':hotel_id': location_id,
            ':is_deleted': True,
        }
    )
    
    deleted_reservations = response.get('Items', [])
    print(f"  Deleted reservations found: {len(deleted_reservations)}")
    for reservation in deleted_reservations:
        print(f"    {reservation['PK']}: DeletedBy={reservation.get('DeletedBy')}, DeletedOn={reservation.get('DeletedOn')}")
    print()

