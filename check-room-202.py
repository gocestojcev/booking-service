#!/usr/bin/env python3
import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

def check_room_202_reservations():
    """Check all reservations for room 202"""
    room_id = "202"
    hotel_id = "loc1"
    
    print(f"Checking all reservations for room {room_id} in hotel {hotel_id}")
    
    # Get all reservations for this room
    response = table.query(
        IndexName='GSI4',
        KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
        FilterExpression="HotelId = :hotel_id",
        ExpressionAttributeValues={
            ":hotel_id": hotel_id,
        },
    )
    
    reservations = response.get('Items', [])
    print(f"\nTotal reservations found: {len(reservations)}")
    
    for i, reservation in enumerate(reservations, 1):
        print(f"\n--- Reservation {i} ---")
        print(f"PK: {reservation['PK']}")
        print(f"Check-in: {reservation.get('CheckInDate')}")
        print(f"Check-out: {reservation.get('CheckOutDate')}")
        print(f"Status: {reservation.get('Status', 'N/A')}")
        print(f"IsDeleted: {reservation.get('IsDeleted', 'N/A')}")
        print(f"DeletedBy: {reservation.get('DeletedBy', 'N/A')}")
        print(f"DeletedOn: {reservation.get('DeletedOn', 'N/A')}")
    
    # Now test availability with the new logic
    print(f"\n--- Testing availability with new logic ---")
    check_in_date = "2025-09-22"  # Change these to your test dates
    check_out_date = "2025-09-25"
    
    response = table.query(
        IndexName='GSI4',
        KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
        FilterExpression="CheckInDate < :check_out AND CheckOutDate > :check_in AND HotelId = :hotel_id AND (attribute_not_exists(IsDeleted) OR IsDeleted = :is_deleted)",
        ExpressionAttributeValues={
            ":check_in": check_in_date,
            ":check_out": check_out_date,
            ":hotel_id": hotel_id,
            ":is_deleted": False,
        },
    )
    
    conflicts = response.get('Items', [])
    print(f"Conflicts found with new logic: {len(conflicts)}")
    
    if conflicts:
        print("Active conflicts:")
        for conflict in conflicts:
            print(f"  - {conflict['PK']}: {conflict.get('CheckInDate')} to {conflict.get('CheckOutDate')}")
    else:
        print("✅ Room should be available!")

if __name__ == "__main__":
    check_room_202_reservations()

