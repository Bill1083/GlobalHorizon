# Global Horizon - Cinematic Travel Social Media

A landscape-first (16:9, 21:9) travel social media platform built as a mobile app with React (Vite) frontend and Python Flask backend.

## 🎬 Project Overview

**Global Horizon** is a "Cinematic-First" travel social media platform that exclusively supports horizontal/landscape-oriented photos and videos. Users can swipe through cinematic travel moments, upload their own content, and share their adventures.

**Key Features:**
- ✅ Fullscreen landscape feed with single-swipe navigation
- ✅ Portrait login/register and navigation pages
- ✅ One-tap upload (Camera or Gallery)
- ✅ Mock authentication with admin support (`admin@test.com`)
- ✅ Clean, dark-mode cinematic UI
- ✅ Mobile-first responsive design

## 📁 Monorepo Structure

```
Global Horizon/
├── frontend/                   # React + Vite app (mobile-first)
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Authentication context
│   │   ├── data/              # Mock data and types
│   │   ├── App.tsx            # Main routing
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
│
├── backend/                    # Flask API
│   ├── app.py                 # Main Flask app with all routes
│   ├── config.py              # Configuration management
│   ├── Procfile               # Render deployment config
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment template
│   ├── utils/                 # Utility modules
│   │   ├── __init__.py
│   │   ├── auth.py            # JWT utilities
│   │   ├── cloudinary_utils.py # Media upload signing
│   │   └── ai_utils.py        # AI integration
│   └── README.md
│
├── .gitignore                 # Git ignore (includes .env!)
├── MONOREPO_STRUCTURE.md      # This structure explained
├── DEPLOYMENT.md              # Production deployment guide
└── README.md                  # This file
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm or yarn (for frontend)
- Git

### 1. Clone & Navigate

```bash
cd "Global Horizon"
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/Scripts/activate    # Windows
# or
source venv/bin/activate        # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run dev server (http://localhost:5000)
python app.py
```

### 4. Test Backend Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔑 Environment Variables

### Backend (.env)

**⚠️ IMPORTANT: Add `.env` to `.gitignore` and NEVER commit it!**

Required keys (copy from `.env.example`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

CLOUDINARY_CLOUD_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

REDIS_URL=redis://default:password@host:10000

JWT_SECRET=your-secure-random-key-32-chars-min

AI_API_KEY=your-ai-key
AI_API_URL=https://api.example.com/v1/summarize

FRONTEND_URL=http://localhost:5173

FLASK_ENV=development
FLASK_DEBUG=False
```

## 🎯 Frontend Architecture

### Key Components

| Component | Purpose |
|-----------|---------|
| `FullscreenFeed` | Fullscreen landscape photo feed with single-swipe navigation |
| `BottomNav` | Navigation overlay for non-feed pages |
| `LandscapeGuard` | Enforces landscape viewing on feed page |
| `AuthContext` | Global authentication state & mock login|

### Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Portrait-mode login (portrait) |
| Register | `/register` | Portrait-mode signup (portrait) |
| Feed | `/app` | Fullscreen landscape photo feed |
| Upload | `/app/upload` | Camera/Gallery picker (portrait) |
| Search | `/app/search` | Map/explore placeholder (portrait) |
| Profile | `/app/profile` | User profile & settings (portrait) |

### UI/UX Highlights

- **Canvas Background**: `#3c3c3c` (dark cinematic)
- **Typography**: Minimalist, uppercase metadata overlays
- **Icons**: Lucide-React for modern navigation
- **Styling**: Tailwind CSS for responsive design
- **Mobile-First**: Designed for phone screens, scales to web

## 🔐 Backend API

### Authentication Routes

```
POST /api/auth/signup
Body: { "email": "user@example.com", "password": "password123" }
Response: { "token": "jwt...", "user": {...} }

POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "token": "jwt...", "user": {...} }
```

### Media Routes

```
GET /api/media/upload-signature (JWT required)
Response: { "cloud_name", "api_key", "timestamp", "signature" }

POST /api/media/post (JWT required)
Body: { "media_url", "caption", "location", "media_type" }
Response: { "post": {...} }
```

### AI Routes

```
POST /api/ai/summarize (JWT required)
Body: { "caption": "text...", "post_id": "uuid" }
Response: { "summary": "...", "tags": [...] }
```

### Feed Routes

```
GET /api/feed/popular
Response: { "posts": [...] } (cached with Redis)
```

### Health Check

```
GET /api/health
GET /
```

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Python 3.9+**
- **Flask** web framework
- **Supabase** PostgreSQL database
- **Cloudinary** media storage
- **Redis** caching
- **JWT** custom authentication
- **Gunicorn** WSGI server

## 📦 Production Deployment

### Frontend (Render Static Site)

1. Push code to GitHub
2. Create Render Static Site pointing to your repo
3. Build command: `npm install && npm run build`
4. Publish directory: `dist/`
5. Set environment: `FRONTEND_URL=https://your-domain.com`

### Backend (Render Web Service)

1. Create Render Web Service from GitHub repo
2. Build command: `pip install -r requirements.txt`
3. Start command:
   ```
   gunicorn --worker-class sync --workers 2 --timeout 60 --bind 0.0.0.0:$PORT app:app
   ```
4. Add all `.env` variables in Render dashboard
5. Auto-deploy on git push

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.**

## 🔄 Git Workflow

```bash
# Clone repo
git clone <repo-url>
cd "Global Horizon"

# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Test locally
# Commit
git add .
git commit -m "feat: add feature description"

# Push
git push origin feature/your-feature

# Create pull request on GitHub
```

**Important:** Always add `.env` files to `.gitignore` before committing!

## ✅ Testing

### Frontend Tests

```bash
npm run build      # Build verification
npm run dev        # Manual testing in browser
```

### Backend Tests

```bash
# Manual API testing
curl http://localhost:5000/api/health

# Full test suite (add pytest to requirements.txt)
pytest
```

## 📊 Feature Roadmap

### Sprint 1 ✅
- [x] Authentication (Login/Signup)
- [x] Fullscreen landscape feed
- [x] Single-swipe navigation
- [x] Upload modal (Camera/Gallery)
- [x] Navigation overlay
- [x] Dark mode UI

### Sprint 2 (Planned)
- [ ] Real backend integration (auth, posts, media)
- [ ] Cloudinary direct upload
- [ ] Like/interaction system
- [ ] Comment section
- [ ] Search & filter

### Sprint 3+ (Future)
- [ ] Real-time WebSocket feed updates
- [ ] Push notifications
- [ ] AI caption summarization
- [ ] Location tagging
- [ ] User profiles & followings

## 🐛 Troubleshooting

### Frontend Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Port 5000 Already in Use
```bash
# Use different port
python -u app.py &
PORT=5001 python app.py
```

### TypeScript Errors
```bash
# Clear build cache
rm -rf dist
npm run build
```

### Redis Connection Error
Check `.env` has correct `REDIS_URL` format

### .env File Not Loading
Ensure `.env` is in `/backend` folder, not root

## 📖 Documentation

- [MONOREPO_STRUCTURE.md](./MONOREPO_STRUCTURE.md) - Project layout
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Flask Docs](https://flask.palletsprojects.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)

## 👥 Team & Support

Built for the Global Horizon project - a cinematic travel social media MVP.

For questions or issues, refer to the documentation or create an issue in the GitHub repo.

---

**Happy building! 🚀**
