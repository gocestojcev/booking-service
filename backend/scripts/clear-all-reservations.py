#!/usr/bin/env python3
"""
Script to clear all reservations from the DynamoDB table.
This will delete all items with EntityType = 'Reservation'.
"""

import boto3
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clear_all_reservations():
    """Clear all reservations from the DynamoDB table."""
    
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
    table_name = os.getenv('DYNAMODB_TABLE_NAME', 'booking-system')
    
    try:
        table = dynamodb.Table(table_name)
        print(f"Connected to table: {table_name}")
        
        # Scan for all reservations
        print("Scanning for reservations...")
        response = table.scan(
            FilterExpression="EntityType = :entity_type",
            ExpressionAttributeValues={
                ":entity_type": "Reservation"
            }
        )
        
        reservations = response.get('Items', [])
        print(f"Found {len(reservations)} reservations to delete")
        
        if not reservations:
            print("No reservations found to delete.")
            return
        
        # Delete each reservation
        deleted_count = 0
        for reservation in reservations:
            try:
                table.delete_item(
                    Key={
                        'PK': reservation['PK'],
                        'SK': reservation['SK']
                    }
                )
                deleted_count += 1
                print(f"Deleted reservation: {reservation['PK']}")
            except ClientError as e:
                print(f"Error deleting reservation {reservation['PK']}: {e}")
        
        print(f"Successfully deleted {deleted_count} reservations")
        
    except ClientError as e:
        print(f"Error accessing DynamoDB: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    print("WARNING: This will delete ALL reservations from the database!")
    confirmation = input("Are you sure you want to continue? (yes/no): ")
    
    if confirmation.lower() == 'yes':
        clear_all_reservations()
    else:
        print("Operation cancelled.")

