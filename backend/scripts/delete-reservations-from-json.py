#!/usr/bin/env python3
"""
Delete reservations from the JSON file.
"""

import json
import subprocess
import sys

def delete_reservations():
    """Delete all reservations from the JSON file."""
    
    # Read the reservations from JSON
    with open('reservations.json', 'r') as f:
        reservations = json.load(f)
    
    print(f"Found {len(reservations)} reservations to delete")
    
    # Delete each reservation
    for i, reservation in enumerate(reservations, 1):
        pk = reservation['PK']
        sk = reservation['SK']
        
        print(f"[{i}/{len(reservations)}] Deleting: {pk}")
        
        # Use AWS CLI to delete the item
        cmd = [
            'aws', 'dynamodb', 'delete-item',
            '--table-name', 'booking-system',
            '--key', f'{{"PK":{{"S":"{pk}"}},"SK":{{"S":"{sk}"}}}}',
            '--profile', 'private'
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(f"  ✓ Deleted successfully")
        except subprocess.CalledProcessError as e:
            print(f"  ✗ Error deleting: {e}")
            print(f"  Error output: {e.stderr}")
    
    print(f"Completed deletion of {len(reservations)} reservations")

if __name__ == "__main__":
    delete_reservations()

