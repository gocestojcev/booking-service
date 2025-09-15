#!/usr/bin/env python3
"""
Simple script to load test data into the booking-system DynamoDB table
"""

import boto3
import json
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
table = dynamodb.Table('booking-system')

def load_test_data():
    print("Loading test data into booking-system table...")
    
    # Test Company
    company_item = {
        'PK': 'COMPANY#comp1',
        'SK': 'METADATA',
        'EntityType': 'Company',
        'Name': 'Drango Hotels',
        'GSI1PK': 'COMPANY#comp1',
        'GSI1SK': 'COMPANY#comp1'
    }
    
    # Test Location (Hotel)
    location_item = {
        'PK': 'LOCATION#loc1',
        'SK': 'METADATA',
        'EntityType': 'Location',
        'Name': 'Drango Hotel Berlin',
        'CompanyId': 'comp1',
        'sort_number': 1,
        'GSI1PK': 'COMPANY#comp1',
        'GSI1SK': 'LOCATION#loc1'
    }
    
    # Test Room
    room_item = {
        'PK': 'ROOM#room1',
        'SK': 'METADATA',
        'EntityType': 'Room',
        'LocationId': 'loc1',
        'Type': 'Standard',
        'Number': '101',
        'Note': 'Ground floor room',
        'IsActive': True,
        'GSI2PK': 'LOCATION#loc1',
        'GSI2SK': 'ROOM#room1'
    }
    
    # Test User
    user_item = {
        'PK': 'USER#user1',
        'SK': 'METADATA',
        'EntityType': 'User',
        'FirstName': 'John',
        'LastName': 'Doe',
        'EmailAddress': 'john.doe@example.com',
        'Password': 'hashed_password_here',
        'CompanyId': 'comp1',
        'GSI1PK': 'COMPANY#comp1',
        'GSI1SK': 'USER#user1'
    }
    
    # Test Reservation
    reservation_item = {
        'PK': 'RESERVATION#res1',
        'SK': 'METADATA',
        'EntityType': 'Reservation',
        'RoomId': 'room1',
        'CheckInDate': '2024-01-15',
        'CheckOutDate': '2024-01-18',
        'Status': 'Confirmed',
        'RoomPrice': Decimal('150.00'),
        'TransportPrice': Decimal('25.00'),
        'ContactName': 'John Doe',
        'ContactLastName': 'Doe',
        'UserId': 'user1',
        'ModifiedBy': 'user1',
        'CreatedOn': datetime.now().isoformat(),
        'ModifiedOn': datetime.now().isoformat(),
        'IsDeleted': False,
        'GSI3PK': 'USER#user1',
        'GSI3SK': 'RESERVATION#res1',
        'GSI4PK': 'ROOM#room1',
        'GSI4SK': 'RESERVATION#res1',
        'GSI5PK': 'DATE#2024-01-15',
        'GSI5SK': 'RESERVATION#res1'
    }
    
    # Test Reservation Person
    person_item = {
        'PK': 'RESERVATION#res1',
        'SK': 'PERSON#person1',
        'EntityType': 'ReservationPerson',
        'FirstName': 'John',
        'LastName': 'Doe'
    }
    
    try:
        # Load all items
        table.put_item(Item=company_item)
        print("✓ Company loaded")
        
        table.put_item(Item=location_item)
        print("✓ Location loaded")
        
        table.put_item(Item=room_item)
        print("✓ Room loaded")
        
        table.put_item(Item=user_item)
        print("✓ User loaded")
        
        table.put_item(Item=reservation_item)
        print("✓ Reservation loaded")
        
        table.put_item(Item=person_item)
        print("✓ Reservation Person loaded")
        
        print("\n✅ All test data loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading test data: {e}")

if __name__ == "__main__":
    load_test_data()
