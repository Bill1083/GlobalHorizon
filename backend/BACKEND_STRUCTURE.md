backend/
├── requirements.txt            # Python dependencies for Render
├── .env.example               # Environment variable template
├── Procfile                   # Render deployment config (optional)
├── app.py                     # Main Flask application
├── config.py                  # Configuration management
├── utils/
│   ├── __init__.py
│   ├── auth.py               # JWT and authentication logic
│   ├── cloudinary_utils.py   # Cloudinary upload signing
│   └── ai_utils.py           # AI API integration
├── routes/
│   ├── __init__.py
│   ├── auth.py               # Login/signup endpoints
│   ├── media.py              # Upload/Cloudinary endpoints
│   ├── ai.py                 # AI summarization endpoints
│   └── feed.py               # Feed and cache endpoints
├── models/
│   ├── __init__.py
│   ├── user.py               # User model
│   └── post.py               # Post model
└── migrations/               # Database schema (if using Alembic)
