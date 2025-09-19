#!/usr/bin/env python3
"""
Simple script to delete all reservations from DynamoDB.
"""

import boto3
import json

def delete_all_reservations():
    """Delete all reservations from the table."""
    
    # Initialize DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
    table = dynamodb.Table('booking-system')
    
    print("Scanning for reservations...")
    
    # Scan for all reservations
    response = table.scan(
        FilterExpression="EntityType = :entity_type",
        ExpressionAttributeValues={
            ":entity_type": "Reservation"
        }
    )
    
    reservations = response.get('Items', [])
    print(f"Found {len(reservations)} reservations")
    
    # Delete each reservation
    for reservation in reservations:
        pk = reservation['PK']
        sk = reservation['SK']
        
        print(f"Deleting: {pk}")
        table.delete_item(
            Key={
                'PK': pk,
                'SK': sk
            }
        )
    
    print(f"Deleted {len(reservations)} reservations")

if __name__ == "__main__":
    delete_all_reservations()

