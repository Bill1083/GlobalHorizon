"""
Global Horizon - Flask Backend
Main application entry point with authentication, Cloudinary, AI, and Redis caching.
"""

import os
import json
from functools import wraps
from datetime import datetime, timedelta

import jwt
import redis
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import cloudinary
import cloudinary.uploader

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_EXPIRY_HOURS'] = 24

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('FRONTEND_URL', 'http://localhost:5173').split(','),
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize Supabase
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# Initialize Redis
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = redis.from_url(redis_url, decode_responses=True)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# ============================================================================
# MIDDLEWARE & DECORATORS
# ============================================================================

def token_required(f):
    """
    Decorator to protect routes that require JWT authentication.
    Extracts and validates the JWT token from Authorization header.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode JWT
            decoded = jwt.decode(
                token,
                app.config['JWT_SECRET'],
                algorithms=[app.config['JWT_ALGORITHM']]
            )
            request.user_id = decoded['user_id']
            request.user_email = decoded['email']
            request.is_admin = decoded.get('is_admin', False)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


def generate_jwt(user_id: str, email: str, is_admin: bool = False) -> str:
    """Generate a JWT token for a user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])
    }
    return jwt.encode(payload, app.config['JWT_SECRET'], algorithm=app.config['JWT_ALGORITHM'])


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """
    Signup endpoint. Creates a new user in Supabase and returns JWT.
    Expected JSON: { "email": "user@example.com", "password": "password123" }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Attempt to sign up via Supabase Auth
        response = supabase.auth.sign_up({
            'email': email,
            'password': password
        })
        
        user_id = response.user.id
        is_admin = email == 'admin@test.com'
        
        # Store user profile in public.users table
        supabase.table('users').insert({
            'id': user_id,
            'email': email,
            'is_admin': is_admin,
            'created_at': datetime.utcnow().isoformat()
        }).execute()
        
        # Generate JWT token
        token = generate_jwt(user_id, email, is_admin)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'is_admin': is_admin
            }
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Login endpoint. Authenticates user and returns JWT.
    Expected JSON: { "email": "user@example.com", "password": "password123" }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Authenticate via Supabase Auth
        response = supabase.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        
        user_id = response.user.id
        
        # Fetch user profile to check admin status
        user_data = supabase.table('users').select('*').eq('id', user_id).single().execute()
        is_admin = user_data.data.get('is_admin', False)
        
        # Generate JWT token
        token = generate_jwt(user_id, email, is_admin)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'is_admin': is_admin
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Invalid credentials or user not found'}), 401


# ============================================================================
# CLOUDINARY ROUTES - Media Upload
# ============================================================================

@app.route('/api/media/upload-signature', methods=['GET'])
@token_required
def get_upload_signature():
    """
    Generate a signed Cloudinary upload payload.
    This allows the frontend to upload directly to Cloudinary securely.
    """
    try:
        timestamp = int(datetime.utcnow().timestamp())
        
        # Generate Cloudinary signature for direct upload
        signature = cloudinary.utils.cloudinary_url(
            'test',
            sign_url=True,
            timestamp=timestamp,
            resource_type='auto'
        )[1]
        
        return jsonify({
            'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME'),
            'api_key': os.getenv('CLOUDINARY_API_KEY'),
            'timestamp': timestamp,
            'signature': signature,
            'upload_url': f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUDINARY_CLOUD_NAME')}/auto/upload"
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/media/post', methods=['POST'])
@token_required
def create_post():
    """
    Create a new post after media has been uploaded to Cloudinary.
    Expected JSON:
    {
        "media_url": "https://cloudinary.com/...",
        "caption": "Beautiful sunset...",
        "location": "Bali, Indonesia",
        "media_type": "image" or "video"
    }
    """
    try:
        data = request.get_json()
        media_url = data.get('media_url')
        caption = data.get('caption', '')
        location = data.get('location', '')
        media_type = data.get('media_type', 'image')
        
        if not media_url:
            return jsonify({'error': 'Media URL required'}), 400
        
        # Store post metadata in Supabase
        post = supabase.table('posts').insert({
            'user_id': request.user_id,
            'media_url': media_url,
            'caption': caption,
            'location': location,
            'media_type': media_type,
            'likes': 0,
            'created_at': datetime.utcnow().isoformat()
        }).execute()
        
        # Invalidate feed cache
        redis_client.delete('feed:popular')
        
        return jsonify({
            'message': 'Post created successfully',
            'post': post.data[0]
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# AI INTEGRATION ROUTES
# ============================================================================

@app.route('/api/ai/summarize', methods=['POST'])
@token_required
def summarize_caption():
    """
    Send caption/journal text to AI API for summarization.
    Saves result to Supabase and returns summary.
    Expected JSON: { "caption": "Long text to summarize...", "post_id": "uuid" }
    """
    try:
        data = request.get_json()
        caption = data.get('caption', '')
        post_id = data.get('post_id')
        
        if not caption or not post_id:
            return jsonify({'error': 'Caption and post_id required'}), 400
        
        # Call external AI API (mocked for now)
        ai_response = mock_ai_summarize(caption)
        
        # Store summary in Supabase
        supabase.table('post_summaries').insert({
            'post_id': post_id,
            'original_text': caption,
            'summary': ai_response['summary'],
            'tags': ai_response['tags'],
            'created_at': datetime.utcnow().isoformat()
        }).execute()
        
        return jsonify({
            'summary': ai_response['summary'],
            'tags': ai_response['tags']
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def mock_ai_summarize(text: str) -> dict:
    """
    Mock AI summarization function.
    In production, this would call an external AI API like OpenAI.
    """
    # TODO: Replace with real API call
    # response = requests.post(
    #     os.getenv('AI_API_URL'),
    #     headers={'Authorization': f"Bearer {os.getenv('AI_API_KEY')}"},
    #     json={'text': text}
    # )
    
    return {
        'summary': f"Summary of: {text[:100]}...",
        'tags': ['travel', 'landscape', 'cinematic']
    }


# ============================================================================
# CACHING ROUTES - Feed
# ============================================================================

@app.route('/api/feed/popular', methods=['GET'])
def get_popular_feed():
    """
    Fetch popular posts with Redis caching.
    Cache TTL: 1 hour (3600 seconds)
    """
    try:
        cache_key = 'feed:popular'
        
        # Try to get from cache
        cached_feed = redis_client.get(cache_key)
        if cached_feed:
            return jsonify({
                'message': 'Feed (from cache)',
                'posts': json.loads(cached_feed)
            }), 200
        
        # Fetch from Supabase if not in cache
        posts = supabase.table('posts')\
            .select('*, users(email)')\
            .order('likes', desc=True)\
            .limit(20)\
            .execute()
        
        # Store in cache for 1 hour
        redis_client.setex(
            cache_key,
            3600,
            json.dumps(posts.data, default=str)
        )
        
        return jsonify({
            'message': 'Feed (from database)',
            'posts': posts.data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Simple health check endpoint for Render monitoring."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200


@app.route('/', methods=['GET'])
def root():
    """Root endpoint."""
    return jsonify({
        'message': 'Global Horizon Backend API',
        'version': '1.0.0',
        'docs': '/api/docs'
    }), 200


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Route not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Development mode
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 10000)),
        debug=os.getenv('FLASK_DEBUG', 'False') == 'True'
    )
