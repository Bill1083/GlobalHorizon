"""
Authentication utilities - JWT and token handling.
"""

import os
import jwt
from datetime import datetime, timedelta


def generate_jwt(user_id: str, email: str, is_admin: bool = False) -> str:
    """Generate a JWT token for a user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=int(os.getenv('JWT_EXPIRY_HOURS', 24)))
    }
    return jwt.encode(
        payload,
        os.getenv('JWT_SECRET'),
        algorithm='HS256'
    )


def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(
            token,
            os.getenv('JWT_SECRET'),
            algorithms=['HS256']
        )
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')
