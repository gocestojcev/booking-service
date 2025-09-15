from contextvars import ContextVar
from datetime import datetime
import boto3
import logging
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)

settings_args = dict(
    region_name="region",
)

# Initialize DynamoDB client (will use IAM role in Lambda, profile in local dev)
try:
    # Try to use private profile for local development
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    # Fall back to default credentials (IAM role in Lambda)
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')
    
table = dynamodb.Table('booking-system')

def get_companies():
    try:
        response = table.scan(
            FilterExpression=Key('EntityType').eq('Company')
        )
        companies = response.get('Items', [])
        return companies
    except Exception as e:
        logger.error(f"Error retrieving companies: {str(e)}", exc_info=True)
        raise

def get_company(company_id: str):
    try:
        response = table.get_item(
            Key={
                'PK': f'COMPANY#{company_id}',
                'SK': 'METADATA'
            }
        )
        return response.get('Item')
    except Exception as e:
        logger.error(f"Error retrieving company {company_id}: {str(e)}", exc_info=True)
        raise

def get_hotels():
    try:
        response = table.scan(
            FilterExpression=Key('EntityType').eq('Location')
        )
     
        hotels = response.get('Items', [])
     
        return sorted(hotels, key=lambda x: x.get('sort_number', 0))
    except Exception as e:
        logger.error(f"Error retrieving hotels: {str(e)}", exc_info=True)
        raise

def get_hotel(hotel_id: str):
    try:
        response = table.get_item(
            Key={
                'PK': f'LOCATION#{hotel_id}',
                'SK': 'METADATA'
            }
        )
        return response.get('Item')
    except Exception as e:
        logger.error(f"Error retrieving hotel {hotel_id}: {str(e)}", exc_info=True)
        raise

def get_rooms(hotel_id: str):
    try:
        response = table.query(
            KeyConditionExpression=Key('PK').eq(f'LOCATION#{hotel_id}') & Key('SK').begins_with('ROOM#')
        )
        rooms = response.get('Items', [])
        
        # Sort rooms by room number (convert to int for proper numerical sorting)
        return sorted(rooms, key=lambda x: int(x.get('Number', '0')))
    except Exception as e:
        logger.error(f"Error retrieving rooms for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise

def get_reservations(hotel_id: str, start_date: str, end_date: str):
    try:
        # Get all rooms for the hotel first
        rooms = get_rooms(hotel_id)
        room_ids = [room['Number'] for room in rooms]  # Use Number field instead of PK
        
        # Get reservations for all rooms in date range
        all_reservations = []
        for room_id in room_ids:
            # Query reservations by room using GSI4
            response = table.query(
                IndexName='GSI4',
                KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
                FilterExpression="(CheckInDate >= :start AND CheckInDate <= :end) OR (CheckOutDate >= :start AND CheckOutDate <= :end)",
                ExpressionAttributeValues={
                    ":start": start_date,
                    ":end": end_date,
                },
            )
            all_reservations.extend(response.get('Items', []))
        
        # For each reservation, get the guest data
        for reservation in all_reservations:
            reservation_id = reservation['PK']
            
            # Query for guest records for this reservation
            guest_response = table.query(
                KeyConditionExpression=Key('PK').eq(reservation_id) & Key('SK').begins_with('PERSON#'),
                FilterExpression="EntityType = :entity_type",
                ExpressionAttributeValues={
                    ":entity_type": "ReservationPerson"
                }
            )
            
            # Convert guest records to the format expected by frontend
            guests = []
            for guest_item in guest_response.get('Items', []):
                guests.append({
                    'first_name': guest_item.get('FirstName', ''),
                    'last_name': guest_item.get('LastName', '')
                })
            
            # Add guests to reservation
            reservation['Guests'] = guests
        
        return all_reservations
    except Exception as e:
        logger.error(f"Error retrieving reservations for hotel {hotel_id} from {start_date} to {end_date}: {str(e)}", exc_info=True)
        raise

def check_room_availability(hotel_id: str, room_id: str, check_in_date: str, check_out_date: str, exclude_reservation_id: str = None):
    """
    Check if a room is available for the given date range
    Returns True if available, False if there's a conflict
    """
    try:
        # Query reservations for this room using GSI4
        response = table.query(
            IndexName='GSI4',
            KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
            FilterExpression="CheckInDate < :check_out AND CheckOutDate > :check_in",
            ExpressionAttributeValues={
                ":check_in": check_in_date,
                ":check_out": check_out_date,
            },
        )
        
        conflicting_reservations = response.get('Items', [])
        
        # If we're updating an existing reservation, exclude it from conflicts
        if exclude_reservation_id:
            conflicting_reservations = [
                res for res in conflicting_reservations 
                if res['PK'] != f'RESERVATION#{exclude_reservation_id}'
            ]
        
        return len(conflicting_reservations) == 0
        
    except Exception as e:
        logger.error(f"Error checking room availability: {str(e)}", exc_info=True)
        return False

def add_reservation(hotel_id: str, reservation: dict):
    try:
        # Validate room availability
        if not check_room_availability(
            hotel_id, 
            reservation['room_number'], 
            reservation['check_in_date'], 
            reservation['check_out_date']
        ):
            raise ValueError(f"Room {reservation['room_number']} is not available for the selected dates")
        
        # Set default user since auth is disabled
        user_id = 'system'
        
        # Create reservation item with new schema
        item = {
            "PK": f"RESERVATION#{reservation['reservation_id']}",
            "SK": "METADATA",
            "EntityType": "Reservation",
            "RoomId": reservation['room_number'],
            "CheckInDate": reservation['check_in_date'],
            "CheckOutDate": reservation['check_out_date'],
            "Status": reservation['status'],
            "ContactName": reservation['contact_name'],
            "ContactLastName": reservation['contact_last_name'],
            "UserId": user_id,
            "ModifiedBy": user_id,
            "CreatedOn": datetime.now().isoformat(),
            "ModifiedOn": datetime.now().isoformat(),
            "IsDeleted": False,
            # GSI keys
            "GSI3PK": f"USER#{user_id}",
            "GSI3SK": f"RESERVATION#{reservation['reservation_id']}",
            "GSI4PK": f"ROOM#{reservation['room_number']}",
            "GSI4SK": f"RESERVATION#{reservation['reservation_id']}",
            "GSI5PK": f"DATE#{reservation['check_in_date']}",
            "GSI5SK": f"RESERVATION#{reservation['reservation_id']}"
        }

        table.put_item(Item=item)
        
        # Add reservation persons if provided
        if 'guests' in reservation:
            for i, guest in enumerate(reservation['guests']):
                person_item = {
                    "PK": f"RESERVATION#{reservation['reservation_id']}",
                    "SK": f"PERSON#{i+1}",
                    "EntityType": "ReservationPerson",
                    "FirstName": guest['first_name'],
                    "LastName": guest['last_name']
                }
                table.put_item(Item=person_item)
        
        logger.info(f"Successfully created reservation {reservation['reservation_id']} for hotel {hotel_id}")
        return item
    except Exception as e:
        logger.error(f"Error creating reservation for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise

def update_reservation(hotel_id: str, reservation_id: str, updates: dict):
    try:
        # Set default user since auth is disabled
        user_id = 'system'
        
        # Check if we're updating dates or room - if so, validate availability
        if 'check_in_date' in updates or 'check_out_date' in updates or 'room_number' in updates:
            # Get current reservation to get the room number if not being updated
            current_reservation = table.get_item(
                Key={
                    "PK": f"RESERVATION#{reservation_id}",
                    "SK": "METADATA"
                }
            ).get('Item')
            
            if not current_reservation:
                raise ValueError(f"Reservation {reservation_id} not found")
            
            # Use updated values or current values
            room_id = updates.get('room_number', current_reservation.get('RoomId'))
            check_in = updates.get('check_in_date', current_reservation.get('CheckInDate'))
            check_out = updates.get('check_out_date', current_reservation.get('CheckOutDate'))
            
            # Validate availability (excluding current reservation)
            if not check_room_availability(hotel_id, room_id, check_in, check_out, reservation_id):
                raise ValueError(f"Room {room_id} is not available for the selected dates")
        
        update_expressions = []
        expression_values = {}
        
        for k, v in updates.items():
            if k in ["PK", "SK", "reservation_id", "EntityType"]:
                continue
            update_expressions.append(f"{k} = :{k}")
            expression_values[f":{k}"] = v

        if not update_expressions:
            logger.warning(f"No valid updates provided for reservation {reservation_id} in hotel {hotel_id}")
            return None

        # Add metadata updates
        update_expressions.append("ModifiedBy = :modified_by")
        update_expressions.append("ModifiedOn = :modified_on")
        expression_values[":modified_by"] = user_id
        expression_values[":modified_on"] = datetime.now().isoformat()

        update_expression = "SET " + ", ".join(update_expressions)

        response = table.update_item(
            Key={
                "PK": f"RESERVATION#{reservation_id}",
                "SK": "METADATA"
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )

        logger.info(f"Successfully updated reservation {reservation_id} for hotel {hotel_id}")
        return response.get('Attributes', {})
    except Exception as e:
        logger.error(f"Error updating reservation {reservation_id} for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise