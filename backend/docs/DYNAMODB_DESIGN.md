# DynamoDB Single-Table Design for Booking System

This document describes the DynamoDB single-table design based on the SQL schema ERD provided.

## Table Structure

**Table Name**: `booking-system`
**Region**: `eu-central-1`
**Billing Mode**: Provisioned (5 RCU/WCU for main table and each GSI)

### Primary Key Structure
- **PK** (Partition Key): String
- **SK** (Sort Key): String

## Entity Mapping

### 1. Company
```
PK: COMPANY#{company_id}
SK: METADATA
Attributes: Name, EntityType
GSI Keys: GSI1PK=COMPANY#{company_id}, GSI1SK=COMPANY#{company_id}
```

### 2. Location (Hotels)
```
PK: LOCATION#{location_id}
SK: METADATA
Attributes: Name, CompanyId, EntityType
GSI Keys: GSI1PK=COMPANY#{company_id}, GSI1SK=LOCATION#{location_id}
```

### 3. User
```
PK: USER#{user_id}
SK: METADATA
Attributes: FirstName, LastName, EmailAddress, Password, CompanyId, EntityType
GSI Keys: GSI1PK=COMPANY#{company_id}, GSI1SK=USER#{user_id}
```

### 4. Room
```
PK: ROOM#{room_id}
SK: METADATA
Attributes: LocationId, Type, Number, Note, IsActive, EntityType
GSI Keys: GSI2PK=LOCATION#{location_id}, GSI2SK=ROOM#{room_id}
```

### 5. Reservation
```
PK: RESERVATION#{reservation_id}
SK: METADATA
Attributes: RoomId, CheckInDate, CheckOutDate, Status, RoomPrice, TransportPrice, 
           Contact, SelfTransport, Agency, Note, UserId, ModifiedBy, 
           CreatedOn, ModifiedOn, IsDeleted, EntityType
GSI Keys: 
  - GSI3PK=USER#{user_id}, GSI3SK=RESERVATION#{reservation_id}
  - GSI4PK=ROOM#{room_id}, GSI4SK=RESERVATION#{reservation_id}
  - GSI5PK=DATE#{check_in_date}, GSI5SK=RESERVATION#{reservation_id}
```

### 6. ReservationPerson
```
PK: RESERVATION#{reservation_id}
SK: PERSON#{person_id}
Attributes: FirstName, LastName, EntityType
```

## Global Secondary Indexes (GSI)

### GSI1 - Company Access Pattern
- **GSI1PK**: `COMPANY#{company_id}`
- **GSI1SK**: `ENTITY_TYPE#{entity_id}`
- **Purpose**: Get all entities (users, locations) belonging to a company

### GSI2 - Location Access Pattern
- **GSI2PK**: `LOCATION#{location_id}`
- **GSI2SK**: `ROOM#{room_id}`
- **Purpose**: Get all rooms for a specific location

### GSI3 - User Access Pattern
- **GSI3PK**: `USER#{user_id}`
- **GSI3SK**: `RESERVATION#{reservation_id}`
- **Purpose**: Get all reservations for a specific user

### GSI4 - Room Access Pattern
- **GSI4PK**: `ROOM#{room_id}`
- **GSI4SK**: `RESERVATION#{reservation_id}`
- **Purpose**: Get all reservations for a specific room

### GSI5 - Date Access Pattern
- **GSI5PK**: `DATE#{date}` (YYYY-MM-DD format)
- **GSI5SK**: `RESERVATION#{reservation_id}`
- **Purpose**: Get reservations by date range

## Access Patterns

### 1. Get All Companies
```python
# Scan with filter
response = table.scan(
    FilterExpression=Key('EntityType').eq('Company')
)
```

### 2. Get Company by ID
```python
response = table.get_item(
    Key={'PK': f'COMPANY#{company_id}', 'SK': 'METADATA'}
)
```

### 3. Get All Locations for a Company
```python
response = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq(f'COMPANY#{company_id}') & 
                          Key('GSI1SK').begins_with('LOCATION#')
)
```

### 4. Get All Rooms for a Location
```python
response = table.query(
    IndexName='GSI2',
    KeyConditionExpression=Key('GSI2PK').eq(f'LOCATION#{location_id}') & 
                          Key('GSI2SK').begins_with('ROOM#')
)
```

### 5. Get All Reservations for a User
```python
response = table.query(
    IndexName='GSI3',
    KeyConditionExpression=Key('GSI3PK').eq(f'USER#{user_id}') & 
                          Key('GSI3SK').begins_with('RESERVATION#')
)
```

### 6. Get All Reservations for a Room
```python
response = table.query(
    IndexName='GSI4',
    KeyConditionExpression=Key('GSI4PK').eq(f'ROOM#{room_id}') & 
                          Key('GSI4SK').begins_with('RESERVATION#')
)
```

### 7. Get Reservations by Date
```python
response = table.query(
    IndexName='GSI5',
    KeyConditionExpression=Key('GSI5PK').eq(f'DATE#{date}') & 
                          Key('GSI5SK').begins_with('RESERVATION#')
)
```

### 8. Get All Persons for a Reservation
```python
response = table.query(
    KeyConditionExpression=Key('PK').eq(f'RESERVATION#{reservation_id}') & 
                          Key('SK').begins_with('PERSON#')
)
```

## Migration from Old Structure

The new `services_new.py` includes legacy functions that map to the new structure:

- `get_hotels()` → `get_locations()`
- `get_hotel(hotel_id)` → `get_location(hotel_id)`
- `get_rooms(hotel_id)` → `get_rooms_by_location(hotel_id)`
- `get_reservations(hotel_id, start_date, end_date)` → Complex query using new structure

## Benefits of This Design

1. **Single Table**: All entities in one table, reducing operational complexity
2. **Efficient Queries**: GSI patterns support all major access patterns
3. **Scalable**: Can handle high throughput with proper partitioning
4. **Cost Effective**: Pay-per-request billing available
5. **Flexible**: Easy to add new entity types and access patterns

## Setup Instructions

1. Run `create-dynamodb-table.sh` to create the table
2. Run `load-sample-data.sh` to populate with test data
3. Update your application to use `services_new.py`
4. Test all access patterns

## Cost Considerations

- **Main Table**: 5 RCU/WCU provisioned
- **Each GSI**: 5 RCU/WCU provisioned
- **Total**: 30 RCU/WCU (can be reduced based on actual usage)
- **Alternative**: Switch to on-demand billing for variable workloads
