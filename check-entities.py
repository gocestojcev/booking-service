#!/usr/bin/env python3
import boto3

# Initialize DynamoDB client
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

# Get all items to see what entity types exist
response = table.scan()
items = response.get('Items', [])

entity_types = set()
for item in items:
    if 'EntityType' in item:
        entity_types.add(item['EntityType'])

print('Available entity types:')
for et in sorted(entity_types):
    print(f'  {et}')

print()
print('Sample items:')
for item in items[:5]:
    print(f'  PK: {item.get("PK", "N/A")}, EntityType: {item.get("EntityType", "N/A")}')

