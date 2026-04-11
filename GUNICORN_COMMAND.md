"""
GUNICORN START COMMAND FOR RENDER
=================================

Use this EXACT command in the Render Dashboard "Start Command" field:

gunicorn --worker-class sync --workers 2 --timeout 60 --bind 0.0.0.0:$PORT app:app

===== EXPLANATION =====

- gunicorn           : WSGI HTTP Server for Python
- --worker-class sync : Synchronous workers (suitable for lightweight I/O)
- --workers 2        : 2 concurrent worker processes (free tier)
- --timeout 60       : 60-second timeout for requests
- --bind 0.0.0.0:$PORT : Bind to all interfaces on Render's dynamic $PORT
- app:app            : Python module 'app', Flask instance 'app'

===== ENVIRONMENT VARIABLES (Render Dashboard) =====

Name                        Value
────────────────────────────────────
SUPABASE_URL               https://your-project.supabase.co
SUPABASE_KEY               your-anon-public-key
SUPABASE_SERVICE_KEY       your-service-role-key
CLOUDINARY_CLOUD_NAME      your-cloud-name
CLOUDINARY_API_KEY         your-cloudinary-api-key
CLOUDINARY_API_SECRET      your-cloudinary-api-secret
REDIS_URL                  redis://default:password@hostname:10000
JWT_SECRET                 your-32-character-random-secret-key
AI_API_KEY                 your-ai-api-key
AI_API_URL                 https://api.example.com/v1/summarize
FRONTEND_URL               https://your-frontend-domain.com,http://localhost:5173
FLASK_ENV                  production
FLASK_DEBUG                False

===== BUILD COMMAND (Render Dashboard) =====

pip install -r requirements.txt

===== REQUIREMENTS.TXT LOCATION =====

Make sure requirements.txt is in the /backend directory

===== DEPLOYMENT CHECKLIST =====

[ ] Push code to GitHub
[ ] Create Render Web Service from GitHub repo
[ ] Set Build Command to: pip install -r requirements.txt
[ ] Set Start Command to: gunicorn --worker-class sync --workers 2 --timeout 60 --bind 0.0.0.0:$PORT app:app
[ ] Add all environment variables in Render dashboard
[ ] Create Supabase database with tables (see DEPLOYMENT.md)
[ ] Test /api/health endpoint
[ ] Verify CORS allows frontend domain
[ ] Monitor logs in Render dashboard

===== TROUBLESHOOTING =====

Error: "gunicorn: command not found"
→ Ensure gunicorn is in requirements.txt

Error: "Address already in use"
→ Render kills old processes automatically

Error: "JWT_SECRET not found"
→ Add JWT_SECRET to environment variables

Error: "Redis connection error"
→ Check REDIS_URL format: redis://default:password@hostname:port

===== MONITOR & LOGS =====

View logs: https://dashboard.render.com → Your Service → Logs tab
View metrics: https://dashboard.render.com → Your Service → Metrics tab
"""
