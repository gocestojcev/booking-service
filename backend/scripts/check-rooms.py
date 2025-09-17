#!/usr/bin/env python3
"""
Script to check rooms for both hotels
"""

import boto3

def check_rooms():
    # Initialize DynamoDB client with private profile
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
    table = dynamodb.Table('booking-system')
    
    print("Checking rooms for both hotels...")
    
    # Check first hotel
    print("\n=== Мојот Хотел 1 (loc1) ===")
    response = table.query(
        IndexName='GSI2',
        KeyConditionExpression='GSI2PK = :pk',
        ExpressionAttributeValues={':pk': 'LOCATION#loc1'}
    )
    
    rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
    print(f"Found {len(rooms)} rooms:")
    for room in rooms:
        print(f"  - Room {room['Number']} ({room['Type']}) - PK: {room['PK']}")
    
    # Check second hotel
    print("\n=== Мојот Хотел 2 (loc2) ===")
    response = table.query(
        IndexName='GSI2',
        KeyConditionExpression='GSI2PK = :pk',
        ExpressionAttributeValues={':pk': 'LOCATION#loc2'}
    )
    
    rooms = [item for item in response['Items'] if item['EntityType'] == 'Room']
    print(f"Found {len(rooms)} rooms:")
    for room in rooms:
        print(f"  - Room {room['Number']} ({room['Type']}) - PK: {room['PK']}")

if __name__ == "__main__":
    check_rooms()
