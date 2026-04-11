"""
MONOREPO STRUCTURE - Global Horizon

Project root layout:
```
Global Horizon/
├── frontend/                 # React + Vite app (mobile-first)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── ... (existing React files)
│
├── backend/                  # Flask API
│   ├── app.py               # Main Flask application with routes
│   ├── config.py            # Configuration management
│   ├── Procfile             # Render deployment config
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example         # Environment variables template
│   ├── utils/               # Utility modules
│   │   ├── __init__.py
│   │   ├── auth.py          # JWT and authentication
│   │   ├── cloudinary_utils.py  # Media upload signing
│   │   └── ai_utils.py      # AI API integration
│   └── routes/              # API route modules (for future expansion)
│
├── .gitignore               # Git ignore file
├── README.md                # Project documentation
└── DEPLOYMENT.md            # Deployment instructions

IMPORTANT: Add .env to .gitignore in the backend folder!
```
"""
