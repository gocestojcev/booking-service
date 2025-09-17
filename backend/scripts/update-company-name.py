import boto3
from botocore.exceptions import ClientError

def update_company_name():
    """
    Update the company name from 'Vili Vardar' to 'Мојата компанија'
    """
    try:
        # Initialize DynamoDB session with private profile
        session = boto3.Session(profile_name='private')
        dynamodb = session.resource('dynamodb', region_name='eu-central-1')
        table = dynamodb.Table('booking-system')
        
        print("Updating company name...")
        
        # First, let's find the company record
        response = table.query(
            KeyConditionExpression='PK = :pk',
            ExpressionAttributeValues={
                ':pk': 'COMPANY#comp1'
            }
        )
        
        if not response['Items']:
            print("❌ Company not found!")
            return
        
        company = response['Items'][0]
        print(f"Found company: {company.get('Name', 'Unknown')}")
        
        # Update the company name
        update_response = table.update_item(
            Key={
                'PK': 'COMPANY#comp1',
                'SK': 'COMPANY#comp1'
            },
            UpdateExpression='SET #name = :new_name',
            ExpressionAttributeNames={
                '#name': 'Name'
            },
            ExpressionAttributeValues={
                ':new_name': 'Мојата компанија'
            },
            ReturnValues='UPDATED_NEW'
        )
        
        print("✅ Company name updated successfully!")
        print(f"New name: {update_response['Attributes']['Name']}")
        
    except ClientError as e:
        print(f"❌ Error updating company: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    update_company_name()
