#!/usr/bin/env python3
"""
Script to check the actual room IDs in the database
"""

import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('booking-system')

def check_room_ids():
    print("Checking room IDs in database...")
    
    try:
        # Get all rooms
        response = table.scan(
            FilterExpression=Key('EntityType').eq('Room')
        )
        
        rooms = response.get('Items', [])
        print(f"Total rooms in database: {len(rooms)}")
        
        for room in rooms:
            pk = room['PK']
            room_id = room.get('RoomId', 'N/A')
            number = room.get('Number', 'N/A')
            location_id = room.get('LocationId', 'N/A')
            gsi2pk = room.get('GSI2PK', 'N/A')
            
            print(f"  - PK: {pk}, RoomId: {room_id}, Number: {number}, LocationId: {location_id}, GSI2PK: {gsi2pk}")
        
    except Exception as e:
        print(f"Error checking room IDs: {e}")

if __name__ == "__main__":
    check_room_ids()
