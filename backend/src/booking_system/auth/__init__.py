"""
Authentication module for the booking system
"""
from .cognito_auth import (
    initialize_cognito_auth,
    get_current_user,
    set_current_user,
    clear_current_user,
    verify_cognito_token,
    current_user_var
)

__all__ = [
    'initialize_cognito_auth',
    'get_current_user',
    'set_current_user',
    'clear_current_user',
    'verify_cognito_token',
    'current_user_var'
]
