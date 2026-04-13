"""
Global Horizon - Flask Backend (Production)
Features: Custom JWT auth with bcrypt, Cloudinary direct uploads, Redis caching, AI mocking
"""

import os
import re
import json
import hashlib
from functools import wraps
from datetime import datetime, timedelta

import jwt
import redis
import requests
import bcrypt
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from supabase import create_client, Client
import cloudinary
import cloudinary.uploader

# Regex for basic email validation (no external libs required)
EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
# Allowed Cloudinary host (prevents arbitrary URL injection)
CLOUDINARY_HOST = 'res.cloudinary.com'

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_EXPIRY_HOURS'] = 24

# CORS Configuration - Allow web and mobile (Capacitor) origins
frontend_url = os.getenv('FRONTEND_URL', '').strip()

# If FRONTEND_URL not set, use development + production Render URLs as fallbacks
if not frontend_url:
    allowed_origins = [
        'http://localhost:5173',      # Development
        'http://localhost:3000',      # Alternative development
        'https://globalhorizon-qrq4.onrender.com',  # Production (Render)
    ]
else:
    # Use configured URLs (comma-separated)
    allowed_origins = [origin.strip() for origin in frontend_url.split(',')]

# Add mobile origins - both schemes needed:
# - 'https://localhost' when capacitor.config.ts sets androidScheme: 'https'
# - 'capacitor://localhost' for older Capacitor or when androidScheme is not set
# - 'http://localhost' as fallback
allowed_origins.extend([
    'https://localhost',        # Capacitor Android with androidScheme: 'https'
    'https://localhost/',       # Chrome on Android sends trailing slash variant
    'capacitor://localhost',    # Capacitor default scheme
    'ionic://localhost',        # Ionic apps
    'http://localhost',         # Local dev WebView
    'file://',                  # Local file access
])

# Remove duplicates while preserving order
allowed_origins = list(dict.fromkeys(allowed_origins))

print(f"✓ CORS enabled for origins: {allowed_origins}")

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Rate limiter – backed by Redis so limits survive Gunicorn worker restarts
# Falls back to in-memory if Redis connection fails at startup
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    storage_options={'socket_connect_timeout': 2},
    default_limits=[],   # No global default; limits are set per-route
    on_breach=lambda limit: (jsonify({'error': 'Too many requests. Please slow down.'}), 429)
)

# Initialize Supabase with service_role key (bypasses RLS for backend operations)
# IMPORTANT: Use SUPABASE_SERVICE_KEY (not SUPABASE_KEY which is anon)
# The service_role key has unrestricted database access, RLS policies don't apply
# This allows backend to insert/update/delete without worrying about RLS policies
supabase_url = os.getenv('SUPABASE_URL')
supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_service_key:
    raise ValueError('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables. Use SERVICE_ROLE key, not anon key.')

supabase: Client = create_client(supabase_url, supabase_service_key)
print(f"✓ Supabase initialized with service_role key (RLS bypassed for backend operations)")


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
# HELPER FUNCTIONS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_jwt(user_id: str, email: str, is_admin: bool = False) -> str:
    """Generate JWT token for a user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])
    }
    return jwt.encode(payload, app.config['JWT_SECRET'], algorithm=app.config['JWT_ALGORITHM'])

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


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit('5 per hour')
def signup():
    """
    Create new user account with bcrypt password hashing.
    Request: { "email": "user@example.com", "password": "password123" }
    Response: { "token": "jwt...", "user": {...} }
    """
    try:
        data = request.get_json(silent=True) or {}
        email = str(data.get('email', '')).lower().strip()[:254]
        password = str(data.get('password', ''))

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if not EMAIL_RE.match(email):
            return jsonify({'error': 'Invalid email address'}), 400

        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400

        if len(password) > 128:
            return jsonify({'error': 'Password too long'}), 400

        # Check if user already exists
        try:
            existing = supabase.table('users').select('id').eq('email', email).single().execute()
            if existing.data:
                return jsonify({'error': 'User already registered'}), 409
        except Exception:
            pass  # User doesn't exist, proceed

        # Hash password
        hashed_password = hash_password(password)

        # Admin emails come from an environment variable (never hardcoded)
        admin_emails_raw = os.getenv('ADMIN_EMAILS', '')
        admin_emails = {e.strip().lower() for e in admin_emails_raw.split(',') if e.strip()}
        is_admin = email in admin_emails

        response = supabase.table('users').insert({
            'email': email,
            'password_hash': hashed_password,
            'is_admin': is_admin,
            'created_at': datetime.utcnow().isoformat()
        }).execute()

        user_id = response.data[0]['id']
        token = generate_jwt(user_id, email, is_admin)

        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {'id': user_id, 'email': email, 'is_admin': is_admin}
        }), 201

    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


@app.route('/api/auth/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    """
    Authenticate user with email/password, return JWT.
    Request: { "email": "user@example.com", "password": "password123" }
    Response: { "token": "jwt...", "user": {...} }
    """
    try:
        data = request.get_json(silent=True) or {}
        email = str(data.get('email', '')).lower().strip()[:254]
        password = str(data.get('password', ''))

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if not EMAIL_RE.match(email):
            return jsonify({'error': 'Invalid credentials'}), 401

        if len(password) > 128:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Fetch user from database
        try:
            response = supabase.table('users').select('*').eq('email', email).single().execute()
        except Exception:
            return jsonify({'error': 'Invalid credentials'}), 401

        if not response.data:
            return jsonify({'error': 'Invalid credentials'}), 401

        user = response.data

        # Verify password with bcrypt
        if not verify_password(password, user['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401

        token = generate_jwt(user['id'], user['email'], user.get('is_admin', False))

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'is_admin': user.get('is_admin', False)
            }
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Invalid credentials'}), 401


# ============================================================================
# CLOUDINARY ROUTES - Media Upload
# ============================================================================

@app.route('/api/media/upload-signature', methods=['GET'])
@token_required
@limiter.limit('20 per minute')
def get_upload_signature():
    """
    Generate a signed Cloudinary upload payload for direct browser uploads.
    CRITICAL: Signature must include ALL parameters sent to Cloudinary (except file, api_key, signature)
    Reference: https://cloudinary.com/documentation/upload_widget_reference#signed_upload
    """
    try:
        import hashlib
        
        timestamp = int(datetime.utcnow().timestamp())
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        api_key = os.getenv('CLOUDINARY_API_KEY')
        api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        if not all([cloud_name, api_key, api_secret]):
            return jsonify({'error': 'Cloudinary credentials not configured'}), 500
        
        # Build public_id (will be sent to Cloudinary)
        public_id = f"globalhorizon/{request.user_id}/{int(datetime.utcnow().timestamp() * 1000)}"
        
        # IMPORTANT: Parameters to sign MUST match what React sends to Cloudinary
        # These must be ALL parameters except: file, api_key, cloud_name, signature
        params_to_sign = {
            'public_id': public_id,          # ← CRITICAL: Must be included
            'timestamp': timestamp
        }
        
        # Create signature string: key=value&key=value&... then append api_secret
        # MUST be in alphabetical order by key
        param_string = '&'.join([f'{k}={v}' for k, v in sorted(params_to_sign.items())])
        auth_string = f"{param_string}{api_secret}"
        
        # Generate SHA-1 signature (Cloudinary standard)
        signature = hashlib.sha1(auth_string.encode()).hexdigest()
        
        print(f"✓ Upload signature generated for user {request.user_id}")
        print(f"  String to sign: {param_string}{api_secret[:10]}...")
        print(f"  Public ID: {public_id}")
        
        return jsonify({
            'cloud_name': cloud_name,
            'api_key': api_key,
            'public_id': public_id,
            'timestamp': timestamp,
            'signature': signature,
            'upload_url': f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
        }), 200
    
    except Exception as e:
        print(f"❌ Upload signature error: {str(e)}")
        return jsonify({'error': 'Failed to generate upload signature'}), 500


@app.route('/api/media/post', methods=['POST'])
@token_required
@limiter.limit('10 per minute')
def create_post():
    """
    Create post record after media uploaded to Cloudinary.
    """
    try:
        data = request.get_json(silent=True) or {}
        media_url = str(data.get('media_url', '')).strip()
        caption = str(data.get('caption', '')).strip()[:500]
        location = str(data.get('location', '')).strip()[:100]
        media_type = str(data.get('media_type', 'image')).strip()
        generate_ai_summary = bool(data.get('generate_ai_summary', False))

        if not media_url:
            return jsonify({'error': 'Media URL required'}), 400

        # Only allow URLs from Cloudinary (prevents arbitrary URL injection)
        if CLOUDINARY_HOST not in media_url or not media_url.startswith('https://'):
            return jsonify({'error': 'Invalid media URL'}), 400

        # Whitelist valid media types
        if media_type not in ('image', 'video'):
            media_type = 'image'

        ai_summary = None
        if generate_ai_summary and caption:
            ai_summary = mock_ai_summarize(caption)

        post = supabase.table('posts').insert({
            'user_id': request.user_id,
            'media_url': media_url,
            'caption': caption,
            'location': location,
            'media_type': media_type,
            'ai_summary': ai_summary,
            'likes': 0,
            'created_at': datetime.utcnow().isoformat()
        }).execute()

        # Invalidate Redis cache so new post appears immediately
        redis_client.delete('feed:popular')

        return jsonify({
            'message': 'Post created successfully',
            'post': post.data[0] if post.data else {}
        }), 201

    except Exception as e:
        print(f"Create post error: {str(e)}")
        return jsonify({'error': 'Failed to create post'}), 500


# ============================================================================
# AI INTEGRATION ROUTES
# ============================================================================

@app.route('/api/ai/summarize', methods=['POST'])
@token_required
@limiter.limit('10 per minute')
def summarize_caption():
    """
    Send caption/journal text to AI API for summarization.
    Saves result to Supabase and returns summary.
    Expected JSON: { "caption": "Long text to summarize...", "post_id": "uuid" }
    """
    try:
        data = request.get_json(silent=True) or {}
        caption = str(data.get('caption', '')).strip()[:500]
        post_id = str(data.get('post_id', '')).strip()

        if not caption or not post_id:
            return jsonify({'error': 'Caption and post_id required'}), 400

        # Basic UUID format check to prevent injection via post_id
        if not re.match(r'^[0-9a-f\-]{36}$', post_id, re.IGNORECASE):
            return jsonify({'error': 'Invalid post_id'}), 400

        ai_response = mock_ai_summarize(caption)

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
        print(f"AI summarize error: {str(e)}")
        return jsonify({'error': 'Summarization failed'}), 500


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
@limiter.limit('60 per minute')
def get_popular_feed():
    """
    Fetch popular posts with Redis caching.
    Cache TTL: 5 minutes (300 seconds) for real-time feel
    """
    try:
        cache_key = 'feed:popular'
        
        # Try to get from cache
        cached_feed = redis_client.get(cache_key)
        if cached_feed:
            return jsonify({
                'posts': json.loads(cached_feed),
                'cached': True
            }), 200
        
        # Fetch from Supabase if not in cache (most recent first)
        result = supabase.table('posts')\
            .select('*, users(email)')\
            .order('created_at', desc=True)\
            .limit(50)\
            .execute()
        
        # Transform response to include creator email
        posts_with_creator = []
        for post in result.data:
            post_data = post.copy()
            creator_info = post.get('users', {})
            if creator_info:
                post_data['creator_email'] = creator_info.get('email', 'Unknown')
            posts_with_creator.append(post_data)
        
        # Store in cache for 5 minutes
        redis_client.setex(
            cache_key,
            300,
            json.dumps(posts_with_creator, default=str)
        )
        
        return jsonify({
            'posts': posts_with_creator,
            'cached': False
        }), 200
    
    except Exception as e:
        print(f"Feed error: {str(e)}")
        return jsonify({'error': 'Failed to load feed'}), 500


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
