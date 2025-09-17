#!/usr/bin/env python3
"""
Script to test the API endpoints
"""

import requests
import json

def test_api():
    # Test the API endpoints
    base_url = "https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod"
    
    print("Testing API endpoints...")
    
    # Test hotels endpoint
    print("\n=== Testing Hotels Endpoint ===")
    try:
        response = requests.get(f"{base_url}/hotels/")
        if response.status_code == 200:
            hotels = response.json()['hotels']
            print(f"✅ Found {len(hotels)} hotels:")
            for hotel in hotels:
                print(f"  - {hotel['Name']} (ID: {hotel['PK'].replace('LOCATION#', '')})")
        else:
            print(f"❌ Hotels endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing hotels: {e}")
    
    # Test rooms for first hotel
    print("\n=== Testing Rooms for First Hotel (loc1) ===")
    try:
        response = requests.get(f"{base_url}/hotels/loc1/rooms")
        if response.status_code == 200:
            rooms = response.json()['rooms']
            print(f"✅ Found {len(rooms)} rooms for first hotel:")
            for room in rooms:
                print(f"  - Room {room['Number']} ({room['Type']})")
        else:
            print(f"❌ Rooms endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing rooms for first hotel: {e}")
    
    # Test rooms for second hotel
    print("\n=== Testing Rooms for Second Hotel (loc2) ===")
    try:
        response = requests.get(f"{base_url}/hotels/loc2/rooms")
        if response.status_code == 200:
            rooms = response.json()['rooms']
            print(f"✅ Found {len(rooms)} rooms for second hotel:")
            for room in rooms:
                print(f"  - Room {room['Number']} ({room['Type']})")
        else:
            print(f"❌ Rooms endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing rooms for second hotel: {e}")

if __name__ == "__main__":
    test_api()
