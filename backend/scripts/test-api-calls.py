#!/usr/bin/env python3
"""
Script to test API calls directly
"""

import requests
import json

def test_api_calls():
    print("Testing API calls...")
    
    try:
        # Test getting hotels
        print("\n=== Testing Hotels API ===")
        response = requests.get('https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod/hotels/')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Hotels: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
        
        # Test getting reservations for hotel 1
        print("\n=== Testing Reservations for Hotel 1 (loc1) ===")
        response = requests.get('https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod/hotels/loc1/reservations?start_date=2024-09-01&end_date=2024-09-30')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Reservations for Hotel 1: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
        
        # Test getting reservations for hotel 2
        print("\n=== Testing Reservations for Hotel 2 (loc2) ===")
        response = requests.get('https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod/hotels/loc2/reservations?start_date=2024-09-01&end_date=2024-09-30')
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Reservations for Hotel 2: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
        
    except Exception as e:
        print(f"Error testing API calls: {e}")

if __name__ == "__main__":
    test_api_calls()
