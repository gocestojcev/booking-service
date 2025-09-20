#!/usr/bin/env python3
import sys
import os

# Add the backend src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

def test_simple():
    """Test a simple function call"""
    try:
        from booking_system.services.reservation_service import check_room_availability
        
        print("Testing check_room_availability function...")
        result = check_room_availability("loc1", "202", "2025-09-22", "2025-09-25")
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple()

