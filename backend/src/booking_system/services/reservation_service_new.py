import boto3
import logging
from datetime import datetime
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)

# Initialize DynamoDB
try:
    session = boto3.Session(profile_name='private')
    dynamodb = session.resource('dynamodb', region_name='eu-central-1')
except Exception:
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')

table = dynamodb.Table('booking-system')

def check_room_availability(hotel_id: str, room_id: str, check_in_date: str, check_out_date: str, exclude_reservation_id: str = None):
    """
    Check if a room is available for the given date range
    Returns True if available, False if there's a conflict
    """
    try:
        print("DEBUG: Starting room availability check")
        
        # Query reservations for this room using GSI4, but only for the specific hotel
        # Exclude deleted reservations from availability check
        response = table.query(
            IndexName='GSI4',
            KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & Key('GSI4SK').begins_with('RESERVATION#'),
            FilterExpression="CheckInDate < :check_out AND CheckOutDate > :check_in AND HotelId = :hotel_id AND (attribute_not_exists(IsDeleted) OR IsDeleted = :is_deleted)",
            ExpressionAttributeValues={
                ":check_in": check_in_date,
                ":check_out": check_out_date,
                ":hotel_id": hotel_id,
                ":is_deleted": False,
            },
        )
        
        conflicting_reservations = response.get('Items', [])
        print(f"DEBUG: Found {len(conflicting_reservations)} conflicting reservations")
        
        # If we're updating an existing reservation, exclude it from conflicts
        if exclude_reservation_id:
            conflicting_reservations = [
                res for res in conflicting_reservations 
                if res['PK'] != f'RESERVATION#{exclude_reservation_id}'
            ]
            print(f"DEBUG: After excluding {exclude_reservation_id}: {len(conflicting_reservations)} conflicts remain")
        
        is_available = len(conflicting_reservations) == 0
        print(f"DEBUG: Room {room_id} availability: {'AVAILABLE' if is_available else 'NOT AVAILABLE'}")
        return is_available
        
    except Exception as e:
        print(f"DEBUG: Error in check_room_availability: {str(e)}")
        logger.error(f"Error checking room availability: {str(e)}", exc_info=True)
        return False

def add_reservation(hotel_id: str, reservation: dict):
    try:
        print("DEBUG: Starting add_reservation")
        print(f"DEBUG: Room: {reservation.get('room_number')}, Check-in: {reservation.get('check_in_date')}, Check-out: {reservation.get('check_out_date')}")
        
        # Validate room availability
        print("DEBUG: Checking room availability")
        availability_result = check_room_availability(
            hotel_id, 
            reservation['room_number'], 
            reservation['check_in_date'], 
            reservation['check_out_date']
        )
        print(f"DEBUG: Availability result: {availability_result}")
        
        if not availability_result:
            print("DEBUG: Room is NOT available - raising error")
            raise ValueError(f"Room {reservation['room_number']} is not available for the selected dates")
        else:
            print("DEBUG: Room is available - continuing")
        
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
            "RoomPrice": 0,  # Default value
            "TransportPrice": 0,  # Default value
            "ContactName": reservation['contact_name'],
            "ContactLastName": reservation['contact_last_name'],
            "ContactPhone": reservation['contact_phone'],
            "Notes": reservation['notes'],
            "UserId": user_id,
            "ModifiedBy": user_id,
            "CreatedOn": datetime.utcnow().isoformat(),
            "ModifiedOn": datetime.utcnow().isoformat(),
            "IsDeleted": False,
            "HotelId": hotel_id,
            "GSI3PK": f"ROOM#{reservation['room_number']}",
            "GSI3SK": f"RESERVATION#{reservation['reservation_id']}",
            "GSI4PK": f"ROOM#{reservation['room_number']}",
            "GSI4SK": f"RESERVATION#{reservation['reservation_id']}",
            "GSI5PK": f"USER#{user_id}",
            "GSI5SK": f"RESERVATION#{reservation['reservation_id']}",
        }
        
        # Put the reservation item
        table.put_item(Item=item)
        
        # Add guest records if any
        if reservation.get('guests'):
            for i, guest in enumerate(reservation['guests']):
                guest_item = {
                    "PK": f"RESERVATION#{reservation['reservation_id']}",
                    "SK": f"PERSON#{i}",
                    "EntityType": "ReservationPerson",
                    "FirstName": guest['first_name'],
                    "LastName": guest['last_name'],
                }
                table.put_item(Item=guest_item)
        
        print("DEBUG: Reservation created successfully")
        return item
        
    except Exception as e:
        print(f"DEBUG: Error in add_reservation: {str(e)}")
        logger.error(f"Error creating reservation for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise

