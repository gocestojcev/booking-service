#!/usr/bin/env python3
import requests
import json

def test_backend_version():
    """Test if the backend is using the updated code"""
    
    # Test data
    test_reservation = {
        "room_number": "202",
        "check_in_date": "2025-09-22",
        "check_out_date": "2025-09-25",
        "status": "Confirmed",
        "contact_name": "Test User",
        "contact_last_name": "Test",
        "contact_phone": "123456789",
        "notes": "Test reservation",
        "guests": []
    }
    
    print("Testing backend with room 202...")
    print(f"Reservation data: {json.dumps(test_reservation, indent=2)}")
    
    try:
        # Make a request to the backend
        response = requests.post(
            "http://localhost:8000/hotels/loc1/reservations",
            json=test_reservation,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Reservation created!")
        else:
            print("❌ FAILED: Reservation not created")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_backend_version()

