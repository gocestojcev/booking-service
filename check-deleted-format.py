#!/usr/bin/env python3
import boto3

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

# Get the deleted reservation to see the exact DeletedOn format
response = table.scan(
    FilterExpression='EntityType = :entity_type AND HotelId = :hotel_id AND IsDeleted = :is_deleted',
    ExpressionAttributeValues={
        ':entity_type': 'Reservation',
        ':hotel_id': 'loc1',
        ':is_deleted': True,
    }
)

deleted_reservations = response.get('Items', [])
print('Deleted reservations in loc1:')
for reservation in deleted_reservations:
    print(f'  PK: {reservation["PK"]}')
    print(f'  DeletedOn: {reservation.get("DeletedOn")}')
    print(f'  DeletedBy: {reservation.get("DeletedBy")}')
    print()

