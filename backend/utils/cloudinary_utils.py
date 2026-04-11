"""
Cloudinary utilities - media upload signing and management.
"""

import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from datetime import datetime


def configure_cloudinary():
    """Configure Cloudinary with environment variables."""
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET')
    )


def generate_upload_signature():
    """
    Generate a signed upload signature for direct browser uploads to Cloudinary.
    Returns timestamp and signature to be used with Cloudinary Upload Widget.
    """
    timestamp = int(datetime.utcnow().timestamp())
    
    # Create the upload parameters
    upload_params = {
        'timestamp': timestamp,
        'folder': 'global-horizon/posts',
        'resource_type': 'auto'
    }
    
    # Generate signature
    signature = cloudinary.utils.api_sign_request(upload_params, os.getenv('CLOUDINARY_API_SECRET'))
    
    return {
        'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'api_key': os.getenv('CLOUDINARY_API_KEY'),
        'timestamp': timestamp,
        'signature': signature,
        'upload_url': f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUDINARY_CLOUD_NAME')}/auto/upload"
    }


def delete_media(public_id: str, resource_type: str = 'image'):
    """Delete a media file from Cloudinary."""
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return result
    except Exception as e:
        raise Exception(f'Error deleting media: {str(e)}')
