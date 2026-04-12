# Global Horizon - Environment Variables Guide

## Frontend (.env.local & Render)

### Development (.env.local)
```env
# Backend API (local development)
VITE_BACKEND_URL=http://localhost:5000/api

# Supabase (for Realtime WebSocket subscriptions)
# Use ANON KEY (public, reads RLS policies)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### Production (Render Environment Variables)
Go to: Render Dashboard → Global Horizon Frontend → Environment

```
VITE_BACKEND_URL=https://globalhorizon-api-backend.onrender.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

**Notes:**
- `VITE_SUPABASE_ANON_KEY` is the public key (safe to expose) - respects RLS policies
- Frontend uses anon key so RLS policies enforce data access control
- Anon key is NOT the service_role key

---

## Backend (.env & Render)

### Development (.env file - in `backend/` directory)
```env
# Flask
FLASK_DEBUG=True
ENVIRONMENT=development
PORT=5000

# JWT Authentication (custom, not Supabase Auth)
JWT_SECRET=your-random-secret-key-change-this-in-production
JWT_EXPIRY_HOURS=24

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Supabase Database
# ⚠️ IMPORTANT: Use SERVICE_ROLE key (not anon key)
# Service role key bypasses RLS - backend needs unrestricted database access
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key-here

# Redis Caching (Render managed)
REDIS_URL=redis://red-d7cuu5n41pts739n3qn0:6379

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services (Optional - mocked for now)
AI_API_URL=https://api.openai.com/v1/moderations
AI_API_KEY=your-ai-api-key-here
```

### Production (Render Web Service Environment)
Go to: Render Dashboard → Global Horizon Backend → Environment

```
FLASK_DEBUG=False
ENVIRONMENT=production
PORT=10000

JWT_SECRET=your-random-secret-key-generate-new-for-production

FRONTEND_URL=https://globalhorizon-qrq4.onrender.com

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

REDIS_URL=redis://red-d7cuu5n41pts739n3qn0:6379

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your-api-key
```

**Important:**
- `JWT_SECRET` must be strong and different for production
- `SUPABASE_SERVICE_KEY` is the service_role key (NOT anon key) - keep private!
- Backend uses service_role to bypass RLS (backend can write to any table)
- Redis URL provided by Render add-on
- Cloudinary keys obtained from Cloudinary dashboard
- Frontend CORS is validated against `FRONTEND_URL`

---

## Key Differences: Anon vs Service Role

| Key | Name | Frontend | Backend | Respects RLS |
|-----|------|----------|---------|-------------|
| Anon Key | `VITE_SUPABASE_ANON_KEY` | ✅ Use this | ❌ Don't use | ✅ Yes |
| Service Role Key | `SUPABASE_SERVICE_KEY` | ❌ Don't use | ✅ Use this | ❌ No |

**Why:**
- Frontend uses anon key so users can only access their own data (RLS enforced)
- Backend uses service_role so it can perform admin operations without RLS restrictions

---

## Required Credentials to Obtain

### 1. Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create/link your project
3. Get from: **Settings → API**
   - `SUPABASE_URL` - project URL
   - `VITE_SUPABASE_ANON_KEY` - **anon/public key** (for frontend, respects RLS)
   - `SUPABASE_SERVICE_KEY` - **service role key** (for backend, bypasses RLS - keep private!)

**Important:** 
- Frontend uses anon key (public, enforces RLS)
- Backend uses service role key (private, unrestricted access)

### 2. Cloudinary
1. Go to [cloudinary.com](https://cloudinary.com)
2. Create account
3. Get from: **Account Settings → API Keys**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET` (keep private)

### 3. Render
1. Go to [render.com](https://render.com)
2. Create account
3. Add-ons:
   - Create PostgreSQL database (used via Supabase, not standalone)
   - Create Redis instance → copy `REDIS_URL`
4. Deploy services:
   - Frontend: Static Site (automated from GitHub)
   - Backend: Web Service (Gunicorn)

### 4. JWT Secret
Generate a strong random key:
```bash
# macOS/Linux
openssl rand -hex 32

# PowerShell (Windows)
$randomBytes = [byte[]]::new(32)
$rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($randomBytes)
[BitConverter]::ToString($randomBytes) -replace '-'
```

---

## Environment Variable Checklist

### Before Deploying to Render

**Frontend Render Deployment:**
- [ ] `VITE_BACKEND_URL` = https://globalhorizon-api-backend.onrender.com/api
- [ ] `VITE_SUPABASE_URL` = your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` = your anon key

**Backend Render Deployment:**
- [ ] `JWT_SECRET` = strong random 64-char string (NEW value, not same as dev)
- [ ] `FRONTEND_URL` = https://globalhorizon-qrq4.onrender.com (for CORS)
- [ ] `SUPABASE_URL` = your project URL
- [ ] `SUPABASE_SERVICE_KEY` = service role key (NOT anon key)
- [ ] `REDIS_URL` = from Render add-on (e.g., redis://red-xxx:6379)
- [ ] `CLOUDINARY_CLOUD_NAME` = cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` = cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` = cloudinary API secret

**Database (Supabase):**
- [ ] Tables created from [SCHEMA.sql](../SCHEMA.sql)
- [ ] RLS policies applied
- [ ] Realtime enabled for posts and users tables

---

## Testing Environment Variables

### Frontend
```bash
# Check if env vars are loaded
npm run dev

# In browser console:
console.log(import.meta.env.VITE_BACKEND_URL)
console.log(import.meta.env.VITE_SUPABASE_URL)
```

### Backend
```bash
# Check Flask environment
python -c "import os; print(os.getenv('JWT_SECRET'))"

# Test Redis connection
redis-cli -u "$REDIS_URL" ping
# Should return: PONG
```

---

## Troubleshooting

| Error | Check |
|-------|-------|
| 401 Unauthorized on API | JWT_SECRET same in backend.  Authorization header format. |
| CORS blocked | FRONTEND_URL in backend env vars. Origins in Flask CORS config. |
| Can't connect to Redis | REDIS_URL correct. Redis instance running on Render. |
| Cloudinary upload fails | API keys correct. Folder permissions. Network access. |
| Supabase RLS fails | JWT_SECRET matches backend. RLS policies correct SQL syntax. |
| Blank frontend screen | VITE_BACKEND_URL correct. Network requests not  blocked. |

---

## Local Development Setup

Create `backend/.env`:
```bash
cd backend
cp .env.example .env  # or create manually

# Edit with your values
nano .env
```

Install dependencies and run:
```bash
pip install -r requirements.txt
python app.py
```

Frontend will use `.env.local` when running `npm run dev`.

---

## Production Deployment Checklist

1. [ ] All env vars set on Render (both services)
2. [ ] JWT_SECRET is strong (64 chars, random)
3. [ ] Database tables created from SCHEMA.sql
4. [ ] RLS policies applied
5. [ ] Frontend deployed and builds successfully
6. [ ] Backend deployed and health check passes
7. [ ] CORS test: curl -H "Origin: ..." http://backend/api/
8. [ ] Auth test: POST /api/auth/signup, receive JWT
9. [ ] Feed test: GET /api/feed/popular (cached response)
10. [ ] Cloudinary test: GET /api/media/upload-signature (JWT protected)
11. [ ] Realtime test: Open feed, upload new post, see instant update
