#!/usr/bin/env python3
"""
Script to add missing HotelId field to existing reservations
"""

import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('booking-system')

def fix_reservation_hotel_ids():
    print("Fixing reservation hotel IDs...")
    
    try:
        # Get all reservations
        response = table.scan(
            FilterExpression=Key('EntityType').eq('Reservation')
        )
        
        reservations = response.get('Items', [])
        print(f"Found {len(reservations)} reservations")
        
        for reservation in reservations:
            reservation_id = reservation['PK']
            room_id = reservation.get('RoomId', '')
            
            print(f"Processing reservation {reservation_id} with room {room_id}")
            
            # Determine hotel ID based on room ID
            # Rooms for hotel 1: room1, room2, etc.
            # Rooms for hotel 2: 301_h2, 302_h2, etc.
            if room_id.endswith('_h2') or room_id in ['301', '302']:
                hotel_id = 'loc2'
                print(f"  -> Hotel 2 (loc2)")
            else:
                hotel_id = 'loc1'
                print(f"  -> Hotel 1 (loc1)")
            
            # Update the reservation with HotelId
            try:
                table.update_item(
                    Key={
                        'PK': reservation_id,
                        'SK': 'METADATA'
                    },
                    UpdateExpression='SET HotelId = :hotel_id',
                    ExpressionAttributeValues={
                        ':hotel_id': hotel_id
                    }
                )
                print(f"  -> Updated with HotelId: {hotel_id}")
            except Exception as e:
                print(f"  -> Error updating reservation: {e}")
        
        print("Reservation hotel ID fix completed!")
        
    except Exception as e:
        print(f"Error fixing reservation hotel IDs: {e}")

if __name__ == "__main__":
    fix_reservation_hotel_ids()
