#!/usr/bin/env python3
"""
Script to fix room structure in DynamoDB
"""

import boto3
from botocore.exceptions import ClientError

def fix_room_structure():
    # Initialize DynamoDB client with private profile
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
    table = dynamodb.Table('booking-system')
    
    try:
        print("Fixing room structure...")
        
        # First, let's see what we have
        print("Current room structure:")
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression='GSI2PK = :pk',
            ExpressionAttributeValues={':pk': 'LOCATION#loc1'}
        )
        
        rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
        print(f"Found {len(rooms)} rooms for first hotel")
        
        # The issue is that rooms for first hotel have wrong PK structure
        # They should be separate items with ROOM# PK, not LOCATION# PK
        
        # Let's check if there are any rooms with correct structure
        response = table.scan(
            FilterExpression='begins_with(PK, :pk) AND EntityType = :entity_type',
            ExpressionAttributeValues={
                ':pk': 'ROOM#',
                ':entity_type': 'Room'
            }
        )
        
        existing_rooms = response.get('Items', [])
        print(f"Found {len(existing_rooms)} rooms with correct ROOM# structure")
        
        # Create proper room items for first hotel
        print("Creating proper room items for first hotel...")
        
        # Define the rooms that should exist for first hotel
        first_hotel_rooms = [
            {'Number': '101', 'Type': 'Standard', 'Note': 'Ground floor room'},
            {'Number': '102', 'Type': 'Standard', 'Note': 'Ground floor room'},
            {'Number': '103', 'Type': 'Standard', 'Note': 'Ground floor room'},
            {'Number': '201', 'Type': 'Standard', 'Note': 'City view'},
            {'Number': '202', 'Type': 'Standard', 'Note': 'City view'},
            {'Number': '203', 'Type': 'Standard', 'Note': 'City view'}
        ]
        
        for room_data in first_hotel_rooms:
            room_item = {
                'PK': f"ROOM#{room_data['Number']}",
                'SK': 'METADATA',
                'EntityType': 'Room',
                'LocationId': 'loc1',
                'Type': room_data['Type'],
                'Number': room_data['Number'],
                'Note': room_data['Note'],
                'IsActive': True,
                'GSI2PK': 'LOCATION#loc1',
                'GSI2SK': f"ROOM#{room_data['Number']}"
            }
            
            table.put_item(Item=room_item)
            print(f"  ✅ Created room {room_data['Number']} for first hotel")
        
        # Delete the incorrect room items for first hotel
        print("Deleting incorrect room items for first hotel...")
        for room in rooms:
            if room['PK'].startswith('LOCATION#'):
                table.delete_item(
                    Key={
                        'PK': room['PK'],
                        'SK': room['SK']
                    }
                )
                print(f"  ✅ Deleted incorrect room item: {room['PK']}")
        
        # Verify the fix
        print("\nVerifying room structure...")
        
        # Check first hotel rooms
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression='GSI2PK = :pk',
            ExpressionAttributeValues={':pk': 'LOCATION#loc1'}
        )
        
        rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
        print(f"First hotel now has {len(rooms)} rooms with correct structure")
        
        # Check second hotel rooms
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression='GSI2PK = :pk',
            ExpressionAttributeValues={':pk': 'LOCATION#loc2'}
        )
        
        rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
        print(f"Second hotel has {len(rooms)} rooms")
        
        print("✅ Room structure fixed successfully!")
        
    except ClientError as e:
        print(f"❌ Error fixing room structure: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    fix_room_structure()
