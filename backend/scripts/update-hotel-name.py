#!/usr/bin/env python3
"""
Script to update hotel name in DynamoDB to 'Мојот Хотел 1'
"""

import boto3
from botocore.exceptions import ClientError

def update_hotel_name():
    # Initialize DynamoDB client with private profile
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
    table = dynamodb.Table('booking-system')
    
    try:
        print("Updating hotel name to 'Мојот Хотел 1'...")
        
        # Update the hotel name
        response = table.update_item(
            Key={
                'PK': 'LOCATION#loc1',
                'SK': 'METADATA'
            },
            UpdateExpression='SET #name = :new_name',
            ExpressionAttributeNames={
                '#name': 'Name'
            },
            ExpressionAttributeValues={
                ':new_name': 'Мојот Хотел 1'
            },
            ReturnValues='ALL_NEW'
        )
        
        print("✅ Hotel name updated successfully!")
        print(f"New hotel name: {response['Attributes']['Name']}")
        
        # Verify the update
        response = table.get_item(
            Key={
                'PK': 'LOCATION#loc1',
                'SK': 'METADATA'
            }
        )
        
        if 'Item' in response:
            print(f"✅ Verification successful: {response['Item']['Name']}")
        else:
            print("❌ Verification failed: Item not found")
            
    except ClientError as e:
        print(f"❌ Error updating hotel name: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    update_hotel_name()
