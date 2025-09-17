#!/usr/bin/env python3
"""
Script to add a second hotel with the same rooms as the first hotel plus additional rooms 301, 302
"""

import boto3
from botocore.exceptions import ClientError

def add_second_hotel():
    # Initialize DynamoDB client with private profile
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
    table = dynamodb.Table('booking-system')
    
    try:
        print("Adding second hotel 'Мојот Хотел 2'...")
        
        # First, get existing rooms from the first hotel
        print("Getting existing rooms from first hotel...")
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression='GSI2PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'LOCATION#loc1'
            }
        )
        
        existing_rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
        print(f"Found {len(existing_rooms)} existing rooms")
        
        # Add the second hotel
        hotel_item = {
            'PK': 'LOCATION#loc2',
            'SK': 'METADATA',
            'EntityType': 'Location',
            'Name': 'Мојот Хотел 2',
            'CompanyId': 'comp1',
            'sort_number': 2,
            'GSI1PK': 'COMPANY#comp1',
            'GSI1SK': 'LOCATION#loc2'
        }
        
        table.put_item(Item=hotel_item)
        print("✅ Hotel 'Мојот Хотел 2' added successfully!")
        
        # Add existing rooms to the second hotel
        print("Adding existing rooms to second hotel...")
        for room in existing_rooms:
            new_room = room.copy()
            new_room['PK'] = f"ROOM#{room['Number']}_h2"  # Add _h2 suffix to avoid conflicts
            new_room['LocationId'] = 'loc2'
            new_room['GSI2PK'] = 'LOCATION#loc2'
            new_room['GSI2SK'] = f"ROOM#{room['Number']}_h2"
            
            table.put_item(Item=new_room)
            print(f"  ✅ Added room {room['Number']} ({room['Type']})")
        
        # Add the two additional rooms
        print("Adding additional rooms 301 and 302...")
        
        # Room 301
        room_301 = {
            'PK': 'ROOM#301_h2',
            'SK': 'METADATA',
            'EntityType': 'Room',
            'LocationId': 'loc2',
            'Type': 'апп 2/4',
            'Number': '301',
            'Note': 'Apartment for 2-4 people',
            'IsActive': True,
            'GSI2PK': 'LOCATION#loc2',
            'GSI2SK': 'ROOM#301_h2'
        }
        
        table.put_item(Item=room_301)
        print("  ✅ Added room 301 (апп 2/4)")
        
        # Room 302
        room_302 = {
            'PK': 'ROOM#302_h2',
            'SK': 'METADATA',
            'EntityType': 'Room',
            'LocationId': 'loc2',
            'Type': 'апп 2/4',
            'Number': '302',
            'Note': 'Apartment for 2-4 people',
            'IsActive': True,
            'GSI2PK': 'LOCATION#loc2',
            'GSI2SK': 'ROOM#302_h2'
        }
        
        table.put_item(Item=room_302)
        print("  ✅ Added room 302 (апп 2/4)")
        
        # Verify the hotel was added
        response = table.get_item(
            Key={
                'PK': 'LOCATION#loc2',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' in response:
            print(f"✅ Verification successful: {response['Item']['Name']}")
        else:
            print("❌ Verification failed: Hotel not found")
            
        # Count rooms for the second hotel
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression='GSI2PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'LOCATION#loc2'
            }
        )
        
        room_count = len([item for item in response['Items'] if item['EntityType'] == 'Room'])
        print(f"✅ Second hotel now has {room_count} rooms")
        
    except ClientError as e:
        print(f"❌ Error adding second hotel: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    add_second_hotel()
