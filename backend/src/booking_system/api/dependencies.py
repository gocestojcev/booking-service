"""
FastAPI Dependencies
"""
import logging
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..auth import get_current_user, verify_cognito_token, set_current_user

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

async def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get the current authenticated user from Cognito JWT token
    """
    try:
        token = credentials.credentials
        
        # Verify the token
        user_data = verify_cognito_token(token)
        if not user_data:
            logger.warning("Invalid or expired token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Set the current user in context
        set_current_user(user_data)
        
        logger.info(f"User authenticated: {user_data.get('username')}")
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency - returns user if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_data = verify_cognito_token(token)
        if user_data:
            set_current_user(user_data)
        return user_data
    except Exception as e:
        logger.warning(f"Optional authentication failed: {e}")
        return None
