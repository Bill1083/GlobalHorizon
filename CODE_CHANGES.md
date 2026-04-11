# Code Changes Reference - Global Horizon Phase 3

## Files Modified/Created This Session

### **NEW FILES**

#### `src/utils/apiClient.ts` (120 lines)
**Purpose:** Centralized API client with JWT token management
**Key Exports:**
```typescript
export const getToken() → Returns JWT from localStorage
export const setToken(token) → Stores JWT in localStorage
export const clearToken() → Clears JWT from localStorage
export const apiCall(endpoint, options) → Generic fetch wrapper with JWT header

export const authAPI = {
  signup(email, password)
  login(email, password)
}

export const mediaAPI = {
  getUploadSignature() → Cloudinary signed upload
  createPost(payload) → Create post with media_url, caption, location
}

export const feedAPI = {
  getPopular() → Fetch cached popular posts
}
```

**Why:** Single source of truth for all backend API calls. Automatic JWT header attachment eliminates header bugs.

---

#### `src/vite-env.d.ts` (1 line)
**Purpose:** Fix TypeScript types for `import.meta.env`
**Content:**
```typescript
/// <reference types="vite/client" />
```

---

#### `capacitor.config.ts` (16 lines)
**Purpose:** Capacitor configuration for Android/iOS builds
**Key Settings:**
```typescript
appId: 'com.globalhorizon.app'
appName: 'Global Horizon'
webDir: 'dist'  // Output folder from npm run build
server.androidScheme: 'https'  // Capacitor protocol
plugins.SplashScreen.launchShowDuration: 0  // No splash delay
```

---

#### `MOBILE_DEPLOYMENT.md` (500+ lines)
**Purpose:** Complete mobile deployment guide with pre-flight checklist
**Includes:**
- Capacitor setup step-by-step
- Android APK build instructions
- CORS, JWT, RLS, environment variable verification
- Curl testing examples
- Troubleshooting guide

---

#### `INTEGRATION_COMPLETE.md` (300+ lines)
**Purpose:** Summary of Phase 3 completion and next steps
**Includes:**
- Overview of all components integrated
- API flow diagrams
- File changes summary
- Pre-flight checklist reference
- Build verification results

---

### **MODIFIED FILES**

#### `src/context/AuthContext.tsx`
**What Changed:**
```typescript
// Before: Mock login
const [user, setUser] = useState(buildUser())

// After: Real backend API
const login = async (email: string, password: string) => {
  setLoading(true)
  const response = await authAPI.login(email, password)
  setToken(response.access_token)  // Store JWT
  const decoded = JSON.parse(atob(response.access_token.split('.')[1]))
  setUser({ id: decoded.user_id, email: decoded.email })
  setLoading(false)
  navigate('/app')
}

const register = async (email: string, password: string) => {
  setLoading(true)
  const response = await authAPI.signup(email, password)
  setToken(response.access_token)
  // ... same as login
}

// On mount: Restore user from localStorage JWT
useEffect(() => {
  const token = getToken()
  if (token) {
    const decoded = JSON.parse(atob(token.split('.')[1]))
    setUser({ id: decoded.user_id, email: decoded.email })
  }
}, [])
```

**Why:** Connects to backend auth endpoints, persists JWT in localStorage, auto-restores user on mount.

---

#### `src/pages/LoginPage.tsx`
**What Changed:**
```typescript
// Before: No error handling
<input placeholder="admin@test.com" />

// After: Error display and loading states
{error && <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-3 text-sm text-red-200">
  {error}
</div>}

<input placeholder="" disabled={loading} />
<button disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
```

**Why:** Better UX with error feedback and prevents multiple submissions during loading.

---

#### `src/pages/RegisterPage.tsx`
**What Changed:**
```typescript
// Before: No confirmation
<input type="password" placeholder="Password" />
<button>Sign Up</button>

// After: Confirmation + validation
const [passwordConfirm, setPasswordConfirm] = useState('')

<input value={password} onChange={(e) => setPassword(e.target.value)} />
<input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} 
  placeholder="Confirm password" />

<button onClick={handleSubmit} disabled={
  password.length < 6 || password !== passwordConfirm || loading
}>
  {loading ? 'Signing up...' : 'Sign Up'}
</button>
```

**Why:** Client-side validation prevents user confusion (passwords must match, 6+ chars).

---

#### `src/components/FullscreenFeed.tsx`
**What Changed:**
```typescript
// Before: Received mock feed as prop
export function FullscreenFeed({ feed: FeedItem[] })

// After: Fetches real data from API
type FeedPost = {
  id: string
  media_url: string
  caption?: string
  location?: string
  creator_email: string
  created_at: string
}

export function FullscreenFeed({ onUploadClick }: { onUploadClick: () => void }) {
  const [feed, setFeed] = useState<FeedPost[]>([])

  useEffect(() => {
    const loadFeed = async () => {
      const response = await feedAPI.getPopular()
      setFeed(response.posts || [])
    }
    loadFeed()
  }, [])

  const creatorName = currentItem.creator_email?.split('@')[0]

  return (
    <img src={currentItem.media_url} />  // Before: currentItem.image
  )
}
```

**Why:** Component now pulls real data instead of mock, displays live posts from backend.

---

#### `src/pages/FeedPage.tsx`
**What Changed:**
```typescript
// Before: Ref-based upload button
<FullscreenFeed feed={mockFeed} />
<button ref={uploadBtnRef} data-upload-btn onClick={...}>Upload</button>

// After: Direct callback prop
<FullscreenFeed onUploadClick={() => navigate('/app/upload')} />
```

**Why:** Simpler pattern, FullscreenFeed handles its own upload navigation.

---

#### `src/pages/UploadPage.tsx`
**What Changed:**
```typescript
// Before: 2-second mock upload
const simulateUpload = () => {
  setTimeout(() => {
    navigate('/app')
  }, 2000)
}

// After: Real Cloudinary + backend flow (2 stages)
const [stage, setStage] = useState<'select' | 'details'>('select')
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [caption, setCaption] = useState('')
const [location, setLocation] = useState('')

const handleSubmit = async (e: FormEvent) => {
  // 1. Get upload signature (JWT protected)
  const signature = await mediaAPI.getUploadSignature()

  // 2. Upload directly to Cloudinary with FormData
  const formData = new FormData()
  formData.append('file', selectedFile)
  formData.append('cloud_name', signature.cloud_name)
  formData.append('api_key', signature.api_key)
  // ... all signature fields

  const cloudinaryResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`,
    { method: 'POST', body: formData }
  )

  // 3. Create post record in backend
  const mediaUrl = cloudinaryResponse.secure_url
  await mediaAPI.createPost({
    media_url: mediaUrl,
    caption: caption || null,
    location: location || null,
    media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image'
  })

  navigate('/app')
}
```

**Why:** Two-stage flow (select file, then add metadata), real upload to Cloudinary, stores post in backend.

---

#### `src/index.css`
**What Changed:**
```css
/* Before: Basic Tailwind only */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After: Mobile optimizations added */
html {
  overscroll-behavior-y: none;  /* Disable pull-to-refresh */
  -webkit-font-smoothing: antialiased;  /* Smooth text rendering */
}

body {
  -webkit-user-select: none;  /* Disable text selection on buttons */
  user-select: none;
  -webkit-touch-callout: none;  /* No long-press context menu */
  -webkit-tap-highlight-color: transparent;  /* No tap flash */
  -webkit-text-size-adjust: 100%;  /* No zoom on input focus */
}

html, body, #root {
  padding-top: env(safe-area-inset-top);  /* Notch support */
  padding-bottom: env(safe-area-inset-bottom);  /* Home indicator support */
}

[class*="screen"], button, input {
  will-change: transform;  /* Hardware acceleration */
  transform: translateZ(0);
}

input, textarea, a {
  -webkit-user-select: text;  /* Allow selection in inputs */
  user-select: text;
}

img {
  pointer-events: none;  /* Prevent image context menu */
  object-fit: cover;
  object-position: center;
}
```

**Why:** Prevents mobile browser behaviors (pull-to-refresh, zoom, unwanted selection) while keeping it smooth.

---

## Environment Variables

### Frontend (`.env.local` or Render)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend (Render Dashboard)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=<supabase-anon-key>
CLOUDINARY_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
JWT_SECRET=<random-secret-key>
REDIS_URL=redis://:<password>@<host>:<port>
```

---

## Build & Deployment

### Frontend Build
```bash
npm run build
# Output: dist/ folder (193 KB gzip)
# Deploy to: Render Static Site (or any static host)
```

### Backend Deployment
```bash
# Already deployed to: Render Web Service
# Uses gunicorn to serve Flask app
# Environment variables configured in Render dashboard
```

---

## Testing Checklist

### Frontend (Browser)
```bash
https://globalhorizon.onrender.com
1. Register new account
2. Login
3. View feed (should show posts)
4. Click "+" to upload
5. Select image, add caption/location
6. Post
7. Return to feed (new post appears after 5s)
```

### Backend (via curl)
```bash
# Test signup
curl -X POST https://backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'
# Response: {"access_token": "eyJ..."}

# Test feed
curl https://backend.onrender.com/api/feed/popular
# Response: {"posts": [{...}, ...]}

# Test CORS (Capacitor origin)
curl -H "Origin: capacitor://localhost" \
  -X OPTIONS https://backend.onrender.com/api/feed/popular
# Should return: Access-Control-Allow-Origin: capacitor://localhost
```

---

## Next: Capacitor Command

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android -D
npx cap init
# Prompts:
#   App name: Global Horizon
#   App Package ID: com.globalhorizon.app
#   Web Dir: dist

npx cap add android
npx cap open android
# → Opens Android Studio
# → Build → Build APK(s)
# → Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Summary of Architecture

```
User (Browser/Mobile)
    ↓
Frontend (React + Vite)
  ← API Client (src/utils/apiClient.ts)
    ↓
Backend (Flask)
  ← JWT Middleware (@token_required)
    ↓
Supabase (Users table, Posts table)
    ↓
Cloudinary (Media storage)
    ↓
Redis (Feed cache)
```

Each component is independent and testable. Frontend and backend are completely decoupled via REST API + JWT.
