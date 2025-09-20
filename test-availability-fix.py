#!/usr/bin/env python3
import boto3
from datetime import datetime, timedelta

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

def test_room_availability():
    """Test that deleted reservations don't block room availability"""
    
    # Test with a room that has a deleted reservation
    room_id = "101"  # Assuming room 101 has a deleted reservation
    hotel_id = "loc1"
    
    # Use dates that would conflict with the deleted reservation
    check_in_date = "2025-09-22"
    check_out_date = "2025-09-25"
    
    print(f"Testing room availability for room {room_id} in hotel {hotel_id}")
    print(f"Check-in: {check_in_date}, Check-out: {check_out_date}")
    
    # Query with the old logic (should include deleted reservations)
    print("\n--- OLD LOGIC (includes deleted reservations) ---")
    response = table.query(
        IndexName='GSI4',
        KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
        FilterExpression="CheckInDate < :check_out AND CheckOutDate > :check_in AND HotelId = :hotel_id",
        ExpressionAttributeValues={
            ":check_in": check_in_date,
            ":check_out": check_out_date,
            ":hotel_id": hotel_id,
        },
    )
    
    old_conflicts = response.get('Items', [])
    print(f"Conflicts found: {len(old_conflicts)}")
    for conflict in old_conflicts:
        print(f"  - {conflict['PK']}: IsDeleted={conflict.get('IsDeleted', 'N/A')}")
    
    # Query with the new logic (excludes deleted reservations)
    print("\n--- NEW LOGIC (excludes deleted reservations) ---")
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
    
    new_conflicts = response.get('Items', [])
    print(f"Conflicts found: {len(new_conflicts)}")
    for conflict in new_conflicts:
        print(f"  - {conflict['PK']}: IsDeleted={conflict.get('IsDeleted', 'N/A')}")
    
    print(f"\nResult: {'✅ FIXED' if len(new_conflicts) < len(old_conflicts) else '❌ NO CHANGE'}")

if __name__ == "__main__":
    test_room_availability()

