#!/usr/bin/env python3
import sys
import os

# Add the backend src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from booking_system.services.reservation_service import check_room_availability

def test_availability():
    """Test the check_room_availability function directly"""
    hotel_id = "loc1"
    room_id = "202"
    check_in_date = "2025-09-22"
    check_out_date = "2025-09-25"
    
    print(f"Testing room availability directly:")
    print(f"Hotel: {hotel_id}")
    print(f"Room: {room_id}")
    print(f"Check-in: {check_in_date}")
    print(f"Check-out: {check_out_date}")
    print()
    
    try:
        result = check_room_availability(hotel_id, room_id, check_in_date, check_out_date)
        print(f"Result: {'AVAILABLE' if result else 'NOT AVAILABLE'}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_availability()

