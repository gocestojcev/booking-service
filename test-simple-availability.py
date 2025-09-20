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

# Test the exact same query that the backend uses
def test_availability_query():
    room_id = "101"  # Change this to the room you're testing
    hotel_id = "loc1"
    check_in_date = "2025-09-22"  # Change these to your test dates
    check_out_date = "2025-09-25"
    
    print(f"Testing availability for room {room_id} in hotel {hotel_id}")
    print(f"Dates: {check_in_date} to {check_out_date}")
    
    # This is the EXACT query from the updated check_room_availability function
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
    print(f"\nConflicts found: {len(conflicts)}")
    
    if conflicts:
        print("Conflicting reservations:")
        for conflict in conflicts:
            print(f"  - {conflict['PK']}")
            print(f"    Check-in: {conflict.get('CheckInDate')}")
            print(f"    Check-out: {conflict.get('CheckOutDate')}")
            print(f"    IsDeleted: {conflict.get('IsDeleted', 'N/A')}")
            print(f"    Status: {conflict.get('Status', 'N/A')}")
            print()
    else:
        print("✅ Room is available!")

if __name__ == "__main__":
    test_availability_query()

