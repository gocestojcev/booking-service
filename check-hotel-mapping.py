#!/usr/bin/env python3
import boto3

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

# Get all hotels
response = table.scan(
    FilterExpression="EntityType = :entity_type",
    ExpressionAttributeValues={
        ":entity_type": "Hotel"
    }
)

hotels = response.get('Items', [])
print("Available hotels:")
for hotel in hotels:
    print(f"  PK: {hotel['PK']}")
    print(f"  Name: {hotel.get('Name', 'N/A')}")
    print(f"  CompanyId: {hotel.get('CompanyId', 'N/A')}")
    print()

# Test deleted reservations for each hotel
for hotel in hotels:
    hotel_pk = hotel['PK']
    hotel_id = hotel_pk.replace('HOTEL#', '') if hotel_pk.startswith('HOTEL#') else hotel_pk
    
    print(f"Testing deleted reservations for hotel {hotel_id} (PK: {hotel_pk})")
    
    response = table.scan(
        FilterExpression='EntityType = :entity_type AND HotelId = :hotel_id AND IsDeleted = :is_deleted',
        ExpressionAttributeValues={
            ':entity_type': 'Reservation',
            ':hotel_id': hotel_id,
            ':is_deleted': True,
        }
    )
    
    deleted_reservations = response.get('Items', [])
    print(f"  Deleted reservations found: {len(deleted_reservations)}")
    for reservation in deleted_reservations:
        print(f"    {reservation['PK']}: DeletedBy={reservation.get('DeletedBy')}, DeletedOn={reservation.get('DeletedOn')}")
    print()

