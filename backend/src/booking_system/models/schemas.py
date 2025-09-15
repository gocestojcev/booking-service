from pydantic import BaseModel
from typing import List, Optional

class Guest(BaseModel):
    first_name: str
    last_name: str

class Reservation(BaseModel):
    reservation_id: str
    room_number: str
    check_in_date: str
    check_out_date: str
    status: str
    contact_name: str
    contact_last_name: str
    guests: List[Guest]

class Room(BaseModel):
    room_number: str
    room_description: str

class Hotel(BaseModel):
    hotel_id: str
    name: str
    city: str
