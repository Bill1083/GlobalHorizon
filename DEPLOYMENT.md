# Global Horizon Backend - Deployment Guide

## Environment Setup

### 1. Create `.env` file in backend/

Copy `.env.example` and fill in all required values:

```bash
cp backend/.env.example backend/.env
```

**Edit `backend/.env` with your actual credentials:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

REDIS_URL=redis://default:password@render-redis-hostname:10000

JWT_SECRET=your-very-secure-random-secret-key-here

AI_API_KEY=your-ai-api-key
AI_API_URL=https://api.example.com/v1/summarize

FRONTEND_URL=http://localhost:5173,https://your-frontend-domain.com
FLASK_ENV=development
FLASK_DEBUG=False
```

### 2. Important: Add `.env` to `.gitignore`

**The `.env` file contains secrets and must NEVER be committed to Git.**

Create or edit `.gitignore` at the root:
```
# Environment variables (NEVER commit these)
backend/.env
frontend/.env
.env

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/

# Node
node_modules/
dist/
build/

# IDEs
.vscode/
.idea/
*.swp
```

## Local Development

### Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Run the Flask app locally:

```bash
cd backend
python app.py
```

The API will be available at `http://localhost:5000`

### Test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Render Deployment

### 1. Add `.env` to Render

In the Render Dashboard:
1. Go to your Web Service
2. Click **Settings** → **Environment**
3. Add all variables from `.env.example`

### 2. Set up PostgreSQL (Supabase)

- Create a project on [Supabase](https://supabase.com)
- Get your `SUPABASE_URL`, `SUPABASE_KEY`, and `SUPABASE_SERVICE_KEY`
- Add to Render environment

### 3. Set up Redis

- Add Redis to Render (free tier available)
- Get the `REDIS_URL` (format: `redis://default:password@hostname:port`)
- Add to Render environment

### 4. Configure Render Web Service

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
gunicorn --worker-class sync --workers 2 --timeout 60 --bind 0.0.0.0:$PORT app:app
```

**Key Points:**
- Render automatically assigns `$PORT` (typically 10000)
- `--worker-class sync` for lightweight operations
- `--workers 2` suitable for free tier (adjust based on load)
- `--timeout 60` seconds for long-running requests
- `--bind 0.0.0.0:$PORT` binds to Render's dynamic port

### 5. Deploy

Push your code to GitHub:
```bash
git add .
git commit -m "Initial backend setup"
git push origin main
```

Render will auto-deploy on push.

## Database Schema (Supabase SQL)

Create these tables in your Supabase database:

### Users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);
```

### Posts table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url VARCHAR NOT NULL,
  caption TEXT,
  location VARCHAR,
  media_type VARCHAR DEFAULT 'image',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Post Summaries table
```sql
CREATE TABLE post_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  original_text TEXT,
  summary TEXT,
  tags VARCHAR[],
  created_at TIMESTAMP DEFAULT now()
);
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login and get JWT

### Media
- `GET /api/media/upload-signature` - Get Cloudinary upload credentials (JWT required)
- `POST /api/media/post` - Create post after upload (JWT required)

### AI
- `POST /api/ai/summarize` - Summarize caption text (JWT required)

### Feed
- `GET /api/feed/popular` - Get popular posts (cached with Redis)

### Health
- `GET /api/health` - Health check
- `GET /` - API info

## Monitoring

Monitor your Render service at: `https://dashboard.render.com`

Check logs:
- Click your Web Service
- Go to **Logs** tab
- Watch real-time output

## Troubleshooting

### Gunicorn command not found
Ensure `gunicorn` is in `requirements.txt`

### Redis connection error
Verify `REDIS_URL` format: `redis://default:password@hostname:10000`

### JWT token invalid
Check `JWT_SECRET` is 32+ characters and matches across environments

### CORS errors
Verify `FRONTEND_URL` includes your deployed frontend domain

## Next Steps

1. Connect the frontend to backend API endpoints
2. Update `AuthContext.tsx` to call `/api/auth/signup` and `/api/auth/login`
3. Implement Cloudinary direct uploads for media
4. Set up real AI API integration (currently mocked)
5. Monitor performance and scale as needed
