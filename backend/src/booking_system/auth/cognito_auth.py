"""
AWS Cognito JWT Authentication Module
"""
import json
import logging
import requests
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import HTTPException, status
from contextvars import ContextVar

# Context variable to store current user
current_user_var: ContextVar[Optional[Dict[str, Any]]] = ContextVar('current_user', default=None)

logger = logging.getLogger(__name__)

class CognitoAuth:
    def __init__(self, region: str, user_pool_id: str):
        self.region = region
        self.user_pool_id = user_pool_id
        self.jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
        self._jwks_cache = None
        self._jwks_cache_time = None
        
    def get_jwks(self) -> Dict[str, Any]:
        """Get JSON Web Key Set from Cognito"""
        import time
        
        # Cache JWKS for 1 hour
        if (self._jwks_cache is None or 
            self._jwks_cache_time is None or 
            time.time() - self._jwks_cache_time > 3600):
            
            try:
                response = requests.get(self.jwks_url, timeout=10)
                response.raise_for_status()
                self._jwks_cache = response.json()
                self._jwks_cache_time = time.time()
                logger.info("Successfully fetched JWKS from Cognito")
            except requests.RequestException as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Authentication service unavailable"
                )
        
        return self._jwks_cache
    
    def get_signing_key(self, token: str) -> Optional[str]:
        """Get the signing key for the token"""
        try:
            # Decode header without verification to get kid
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                logger.warning("Token missing 'kid' in header")
                return None
            
            jwks = self.get_jwks()
            
            # Find the key with matching kid
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    return json.dumps(key)
            
            logger.warning(f"No matching key found for kid: {kid}")
            return None
            
        except JWTError as e:
            logger.error(f"Error getting signing key: {e}")
            return None
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode the JWT token"""
        try:
            logger.info(f"Verifying token: {token[:50]}...")
            
            # Get the signing key
            signing_key = self.get_signing_key(token)
            if not signing_key:
                logger.error("Failed to get signing key")
                return None
            
            logger.info("Got signing key, attempting to decode token")
            
            # Verify and decode the token
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=['RS256'],
                audience=None,  # Cognito doesn't use audience
                issuer=f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}",
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": False,  # Cognito doesn't use audience
                }
            )
            
            logger.info(f"Token decoded successfully, payload keys: {list(payload.keys())}")
            
            # Validate token type
            if payload.get('token_use') != 'access':
                logger.warning(f"Invalid token type: {payload.get('token_use')}")
                return None
            
            logger.info(f"Successfully verified token for user: {payload.get('username')}")
            return payload
            
        except JWTError as e:
            logger.error(f"Token verification failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            return None

# Global Cognito auth instance
cognito_auth: Optional[CognitoAuth] = None

def initialize_cognito_auth(region: str, user_pool_id: str):
    """Initialize the global Cognito auth instance"""
    global cognito_auth
    cognito_auth = CognitoAuth(region, user_pool_id)
    logger.info(f"Cognito auth initialized for region: {region}, user pool: {user_pool_id}")

def get_current_user() -> Optional[Dict[str, Any]]:
    """Get the current authenticated user from context"""
    return current_user_var.get()

def set_current_user(user: Dict[str, Any]):
    """Set the current authenticated user in context"""
    current_user_var.set(user)

def clear_current_user():
    """Clear the current authenticated user from context"""
    current_user_var.set(None)

def verify_cognito_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a Cognito JWT token"""
    if not cognito_auth:
        logger.error("Cognito auth not initialized")
        return None
    
    return cognito_auth.verify_token(token)
