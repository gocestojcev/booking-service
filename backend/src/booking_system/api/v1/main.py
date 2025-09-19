from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from ...services.reservation_service import add_reservation, get_hotels, get_hotel, get_rooms, get_reservations, update_reservation, get_companies, get_company
from ...models.schemas import Reservation, ReservationUpdate
from ...api.dependencies import get_authenticated_user
from ...auth import initialize_cognito_auth
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize Cognito authentication
cognito_region = os.getenv("COGNITO_REGION", "eu-central-1")
cognito_user_pool_id = os.getenv("COGNITO_USER_POOL_ID", "")
if cognito_user_pool_id:
    initialize_cognito_auth(cognito_region, cognito_user_pool_id)
    logger.info(f"Cognito authentication initialized for region: {cognito_region}")
else:
    logger.warning("COGNITO_USER_POOL_ID not set - authentication disabled")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React app URL for local development
        "http://booking-system-frontend-675316576819.s3-website.eu-central-1.amazonaws.com",  # S3 frontend URL
        "https://d250rdy15p5hge.cloudfront.net"  # CloudFront frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/companies/")
def read_companies(current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing companies")
        return {"companies": get_companies()}
    except Exception as e:
        logger.error(f"Error retrieving companies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/companies/{company_id}")
def read_company(company_id: str, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing company {company_id}")
        return {"company": get_company(company_id)}
    except Exception as e:
        logger.error(f"Error retrieving company {company_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving company: {str(e)}")

@app.get("/hotels/")
def read_hotels(current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing hotels")
        return {"hotels": get_hotels()}
    except Exception as e:
        logger.error(f"Error retrieving hotels: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/hotels/{hotel_id}")
def read_hotel(hotel_id: str, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing hotel {hotel_id}")
        return {"hotel": get_hotel(hotel_id)}
    except Exception as e:
        logger.error(f"Error retrieving hotel {hotel_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving hotel: {str(e)}")

@app.get("/hotels/{hotel_id}/rooms")
def read_rooms(hotel_id: str, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing rooms for hotel {hotel_id}")
        return {"rooms": get_rooms(hotel_id)}
    except Exception as e:
        logger.error(f"Error retrieving rooms for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving rooms: {str(e)}")

@app.get("/hotels/{hotel_id}/reservations")
def read_reservations(hotel_id: str, start_date: str, end_date: str, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} accessing reservations for hotel {hotel_id}")
        return {"reservations": get_reservations(hotel_id, start_date, end_date)}
    except Exception as e:
        logger.error(f"Error retrieving reservations for hotel {hotel_id} from {start_date} to {end_date}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving reservations: {str(e)}")

@app.post("/hotels/{hotel_id}/reservations")
def create_reservation(hotel_id: str, reservation: Reservation, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} creating reservation for hotel {hotel_id}")
        reservation_data = reservation.model_dump()
        created_item = add_reservation(hotel_id, reservation_data)
        return {"message": "Reservation created successfully", "reservation": created_item}
    except ValueError as e:
        logger.warning(f"Validation error creating reservation for hotel {hotel_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating reservation for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating reservation: {str(e)}")

@app.put("/hotels/{hotel_id}/reservations/{reservation_id}")
def modify_reservation(hotel_id: str, reservation_id: str, reservation: ReservationUpdate, current_user: dict = Depends(get_authenticated_user)):
    try:
        logger.info(f"User {current_user.get('username')} updating reservation {reservation_id} for hotel {hotel_id}")
        logger.info(f"Received reservation data: {reservation}")
        reservation_data = reservation.model_dump()
        logger.info(f"Converted to dict: {reservation_data}")
        logger.info(f"Final update data: {reservation_data}")
        updated_item = update_reservation(hotel_id, reservation_id, reservation_data)
        if not updated_item:
            logger.warning(f"Reservation not found or no updates applied for hotel_id: {hotel_id}, reservation_id: {reservation_id}")
            raise HTTPException(status_code=404, detail="Reservation not found or no updates applied")
        return {"message": "Reservation updated successfully", "reservation": updated_item}
    except ValueError as e:
        logger.warning(f"Validation error updating reservation {reservation_id} for hotel {hotel_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating reservation {reservation_id} for hotel {hotel_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating reservation: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)