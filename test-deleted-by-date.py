#!/usr/bin/env python3
import boto3
from datetime import datetime

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

# Test the updated filter logic
print("Testing deleted reservations by deletion date...")

# Test with today's date range (should find the deleted reservations)
today = datetime.now().strftime('%Y-%m-%d')
print(f"Searching for deletions on: {today}")

response = table.scan(
    FilterExpression='EntityType = :entity_type AND HotelId = :hotel_id AND IsDeleted = :is_deleted AND DeletedOn >= :start AND DeletedOn <= :end',
    ExpressionAttributeValues={
        ':entity_type': 'Reservation',
        ':hotel_id': 'loc1',
        ':is_deleted': True,
        ':start': today,
        ':end': today,
    }
)

deleted_reservations = response.get('Items', [])
print(f"Found {len(deleted_reservations)} deleted reservations for hotel loc1 on {today}")
for reservation in deleted_reservations:
    print(f"  {reservation['PK']}: DeletedBy={reservation.get('DeletedBy')}, DeletedOn={reservation.get('DeletedOn')}")

print()

# Test with a broader date range (last 7 days)
from datetime import timedelta
week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
print(f"Searching for deletions from {week_ago} to {today}")

response = table.scan(
    FilterExpression='EntityType = :entity_type AND HotelId = :hotel_id AND IsDeleted = :is_deleted AND DeletedOn >= :start AND DeletedOn <= :end',
    ExpressionAttributeValues={
        ':entity_type': 'Reservation',
        ':hotel_id': 'loc1',
        ':is_deleted': True,
        ':start': week_ago,
        ':end': today,
    }
)

deleted_reservations = response.get('Items', [])
print(f"Found {len(deleted_reservations)} deleted reservations for hotel loc1 in the last 7 days")
for reservation in deleted_reservations:
    print(f"  {reservation['PK']}: DeletedBy={reservation.get('DeletedBy')}, DeletedOn={reservation.get('DeletedOn')}")

