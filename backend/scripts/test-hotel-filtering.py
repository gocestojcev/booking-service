#!/usr/bin/env python3
"""
Script to test hotel filtering and see what reservations are returned for each hotel
"""

import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timedelta

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('booking-system')

def test_hotel_filtering():
    print("Testing hotel filtering...")
    
    try:
        # Test Hotel 1 (loc1)
        print("\n=== HOTEL 1 (loc1) ===")
        rooms_hotel1 = get_rooms('loc1')
        print(f"Rooms in Hotel 1: {[room['PK'] for room in rooms_hotel1]}")
        
        reservations_hotel1 = get_reservations('loc1', '2024-09-01', '2024-09-30')
        print(f"Reservations in Hotel 1: {len(reservations_hotel1)}")
        for res in reservations_hotel1:
            print(f"  - {res['PK']}: Room {res.get('RoomId')}, HotelId: {res.get('HotelId')}, Dates: {res.get('CheckInDate')} to {res.get('CheckOutDate')}")
        
        # Test Hotel 2 (loc2)
        print("\n=== HOTEL 2 (loc2) ===")
        rooms_hotel2 = get_rooms('loc2')
        print(f"Rooms in Hotel 2: {[room['PK'] for room in rooms_hotel2]}")
        
        reservations_hotel2 = get_reservations('loc2', '2024-09-01', '2024-09-30')
        print(f"Reservations in Hotel 2: {len(reservations_hotel2)}")
        for res in reservations_hotel2:
            print(f"  - {res['PK']}: Room {res.get('RoomId')}, HotelId: {res.get('HotelId')}, Dates: {res.get('CheckInDate')} to {res.get('CheckOutDate')}")
        
        # Check all reservations in database
        print("\n=== ALL RESERVATIONS IN DATABASE ===")
        response = table.scan(
            FilterExpression=Key('EntityType').eq('Reservation')
        )
        all_reservations = response.get('Items', [])
        print(f"Total reservations in database: {len(all_reservations)}")
        for res in all_reservations:
            print(f"  - {res['PK']}: Room {res.get('RoomId')}, HotelId: {res.get('HotelId')}, Dates: {res.get('CheckInDate')} to {res.get('CheckOutDate')}")
        
    except Exception as e:
        print(f"Error testing hotel filtering: {e}")

def get_rooms(hotel_id: str):
    try:
        response = table.query(
            IndexName='GSI2',
            KeyConditionExpression=Key('GSI2PK').eq(f'LOCATION#{hotel_id}') & Key('GSI2SK').begins_with('ROOM#')
        )
        return response.get('Items', [])
    except Exception as e:
        print(f"Error getting rooms for hotel {hotel_id}: {e}")
        return []

def get_reservations(hotel_id: str, start_date: str, end_date: str):
    try:
        rooms = get_rooms(hotel_id)
        room_ids = [room['PK'].replace('ROOM#', '') for room in rooms]
        
        all_reservations = []
        for room_id in room_ids:
            response = table.query(
                IndexName='GSI4',
                KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
                FilterExpression="((CheckInDate >= :start AND CheckInDate <= :end) OR (CheckOutDate >= :start AND CheckOutDate <= :end)) AND HotelId = :hotel_id",
                ExpressionAttributeValues={
                    ":start": start_date,
                    ":end": end_date,
                    ":hotel_id": hotel_id,
                },
            )
            all_reservations.extend(response.get('Items', []))
        
        return all_reservations
    except Exception as e:
        print(f"Error getting reservations for hotel {hotel_id}: {e}")
        return []

if __name__ == "__main__":
    test_hotel_filtering()
