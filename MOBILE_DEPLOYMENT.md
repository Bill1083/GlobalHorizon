## Global Horizon - Mobile APK Deployment Guide

This guide covers Capacitor setup to package the Global Horizon web app as an Android APK (iOS support included).

---

## PART 1: CAPACITOR INITIALIZATION

### Step 1: Install Capacitor CLI and Core

```bash
npm install @capacitor/core @capacitor/cli --save-dev
npm install @capacitor/android @capacitor/ios
```

### Step 2: Initialize Capacitor in Your Project

```bash
npx cap init
```

**When prompted, provide:**
- App name: `Global Horizon`
- App Package ID: `com.globalhorizon.app`
  - Format: `com.<company>.<appname>`
  - Android requires lowercase, no spaces
- Web Dir: `dist`
  - This is where `npm run build` outputs files

**This creates:**
- `capacitor.config.ts` (project configuration)
- `android/` folder (Native Android project)
- `ios/` folder (Native iOS project)

### Step 3: Build Frontend for Capacitor

```bash
npm run build
```

### Step 4: Add Android Platform

```bash
npx cap add android
```

This scaffolds the Android Studio project with native bindings.

### Step 5: Sync Web Assets to Native

After any frontend changes, sync them to native:

```bash
npx cap sync
```

Or individually:
```bash
npx cap sync android
npx cap sync ios
```

---

## PART 2: CAPACITOR CONFIGURATION

### capacitor.config.ts (Already optimized for Global Horizon)

Create/update `capacitor.config.ts` in project root:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.globalhorizon.app',
  appName: 'Global Horizon',
  webDir: 'dist',
  server: {
    androidScheme: 'https' // Capacitor protocol
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0 // Remove splash screen delay
    }
  }
};

export default config;
```

### android/app/build.gradle (Minimum SDK Version)

Ensure Android can handle modern JS/fetch APIs:

```gradle
android {
    compileSdkVersion 34
    minSdkVersion 26  // Target Android 8.0+
    targetSdkVersion 34
}
```

---

## PART 3: BUILD FOR ANDROID APK

### Prerequisites
- [Android Studio](https://developer.android.com/studio) installed
- Android SDK Platform 34 installed (via Android Studio)
- ANDROID_HOME environment variable set
  - On Windows: `C:\Users\<username>\AppData\Local\Android\Sdk`

### Build Steps

#### 1. Open Android Project in Android Studio
```bash
npx cap open android
```
This launches Android Studio with your project.

#### 2. Build Unsigned APK (Development)
In Android Studio:
- Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 3. Generate Signed APK (Production)
```bash
# Option A: Via Android Studio (recommended for first-time)
# Build → Generate Signed Bundle / APK → APK → Next
# Create new keystore file (save safely!)
# Enter keystore password and key password
# Select "release" build variant
# Output: android/app/build/outputs/apk/release/app-release.apk
```

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

**SAVE YOUR KEYSTORE FILE!** You'll need it to update the app later.

---

## PART 4: PRE-FLIGHT SAFETY CHECKLIST

### ✅ CORS Configuration (Backend)

**Verify in `backend/app.py`:**

```python
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://localhost:3000",    # Local dev
        "http://localhost:5173",    # Vite dev  
        "https://yourdomain.com",   # Production web
        "capacitor://localhost",    # Capacitor Android
        "ionic://localhost",        # Capacitor iOS
        "file://"                   # File:// protocol (native webview)
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})
```

**Test:** 
```bash
curl -H "Origin: capacitor://localhost" -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS https://your-backend-on-render.onrender.com/api/feed/popular
```
Should return `Access-Control-Allow-Origin: capacitor://localhost`

---

### ✅ JWT Token Header Format

**Verify in `src/utils/apiClient.ts`:**

```typescript
const finalHeaders: Record<string, string> = {
  'Content-Type': 'application/json'
};

if (requiresAuth) {
  const token = getToken();
  finalHeaders['Authorization'] = `Bearer ${token}`;  // ← Format: "Bearer <token>"
}
```

**Verify in `backend/app.py` token validation:**

```python
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Extract "Bearer <token>"
            except IndexError:
                return jsonify({"error": "Invalid token format"}), 401
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            data = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
            # ... rest of validation
        except:
            return jsonify({"error": "Invalid token"}), 401
    return decorated
```

---

### ✅ Supabase RLS (Row Level Security) Policies

**Check RLS is enabled** (if using custom JWT auth, Supabase RLS may not apply):

Go to Supabase Dashboard:
1. **Authentication → Policies**
2. Ensure `users` table RLS is **ENABLED**
3. Ensure `posts` table RLS is **ENABLED**

**Recommended policies:**

For `users` table (read own user):
```sql
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
USING (auth.uid() = id);
```

For `posts` table (read all, insert own):
```sql
CREATE POLICY "Anyone can read posts"
ON public.posts FOR SELECT
USING (true);

CREATE POLICY "Users can insert own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

⚠️ **NOTE:** If using custom JWT (not Supabase auth), RLS won't work. Either:
- Disable RLS tests, OR
- Switch backend to use Supabase authentication instead of custom JWT

---

### ✅ Environment Variables

**Verify `.env.local` (local development):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Verify Render deployment (Frontend):**
Dashboard → Global Horizon Frontend → Environment
```
VITE_API_URL=https://global-horizon-backend.onrender.com/api
```

**Verify Render deployment (Backend):**
Dashboard → Global Horizon Backend → Environment
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=<supabase-anon-key>
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
JWT_SECRET=your-random-secret-key
REDIS_URL=redis://:<password>@<host>:<port>
```

**Test all env vars are set:**
```bash
# Backend (after deployment)
curl https://global-horizon-backend.onrender.com/api/feed/popular
# Should return: {"posts": [...]} (no 500 errors)
```

---

### ✅ Database Tables Exist

**Verify in Supabase Dashboard → SQL Editor:**

```sql
-- Check users table
SELECT * FROM public.users LIMIT 1;

-- Check posts table
SELECT * FROM public.posts LIMIT 1;
```

If tables don't exist, create them:

```sql
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
```

---

### ✅ Cloudinary Configuration

**Verify in backend:**
```python
import cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)
```

**Test upload signature generation:**
```bash
curl -H "Authorization: Bearer <your_jwt_token>" \
  https://global-horizon-backend.onrender.com/api/media/upload-signature
```

Should return:
```json
{
  "cloud_name": "your-name",
  "api_key": "your-key",
  "public_id": "gh/<timestamp>-<random>",
  "timestamp": 1234567890,
  "signature": "abc123..."
}
```

---

### ✅ Authentication Flow Test

**Step 1: Register a new user**
```bash
curl -X POST https://global-horizon-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

Should return:
```json
{"access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."}
```

**Step 2: Login**
```bash
curl -X POST https://global-horizon-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

Should return JWT token.

**Step 3: Access protected endpoint**
```bash
curl -H "Authorization: Bearer <jwt_from_step_2>" \
  https://global-horizon-backend.onrender.com/api/media/upload-signature
```

Should return upload signature (not 401 Unauthorized).

---

### ✅ Mobile-Specific Checks

**1. Viewport Configuration (`public/index.html`)**
```html
<meta name="viewport" content="
  width=device-width,
  initial-scale=1,
  viewport-fit=cover,
  user-scalable=no
">
```

**2. Safe Area CSS Applied**
- ✅ Verified in `src/index.css` (safe-area-inset values applied)
- Notch/home indicator handling enabled

**3. Offline Support (Optional - PWA)**
If adding offline support, create `public/service-worker.js`:
```javascript
// Minimal offline cache
const cacheName = 'gh-v1';
const urlsToCache = ['/index.html', '/assets/*'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**4. Hardware Acceleration (WebGL)**
- ✅ CSS transforms applied in `src/index.css`
- Swipe animations use GPU acceleration

---

## DEPLOYMENT VERIFICATION

### ✅ Before Building APK, Test:

1. **Frontend builds without errors**
   ```bash
   npm run build
   ```
   Should output `dist/` folder with HTML/CSS/JS bundles.

2. **Backend is running and accessible**
   ```bash
   curl https://global-horizon-backend.onrender.com/api/feed/popular
   ```
   Should return posts (or `{"posts":[]}` if no posts yet).

3. **Auth signup works**
   ```bash
   curl -X POST https://global-horizon-backend.onrender.com/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test@123"}'
   ```
   Should return JWT token.

4. **CORS allows Capacitor origin**
   ```bash
   curl -H "Origin: capacitor://localhost" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://global-horizon-backend.onrender.com/api/feed/popular
   ```
   Should return `Access-Control-Allow-Origin: capacitor://localhost`.

5. **Feed loads with creator emails**
   ```bash
   curl https://global-horizon-backend.onrender.com/api/feed/popular
   ```
   Response should include `creator_email` in each post.

---

## Build & Distribution

### Debug APK (Testing)
```bash
npx cap open android
# In Android Studio: Build → Build APK(s)
# Find: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (Distribution)
```bash
npx cap open android
# In Android Studio:
# Build → Generate Signed Bundle / APK → APK
# Sign with your keystore file
# Find: android/app/build/outputs/apk/release/app-release.apk
```

### Upload to Google Play Store
1. Create [Google Play Console](https://play.google.com/console) account
2. Create app, upload signed APK
3. Add store listing and screenshots
4. Submit for review (24-48 hours)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **App loads blank screen** | Check `capacitor.config.ts` webDir points to `dist/`. Run `npm run build` then `npx cap sync`. |
| **API calls fail (401 Unauthorized)** | Ensure JWT token is stored in localStorage. Check `Authorization: Bearer <token>` header format. |
| **CORS error in console** | Verify backend CORS includes `capacitor://localhost`. Test with curl command above. |
| **Images don't load** | Verify Cloudinary URLs are HTTPS. Check image permissions in Cloudinary dashboard. |
| **Can't sign APK** | Ensure Android Studio is fully updated. Create new keystore if lost (can't recover old app updates). |
| **App crashes on startup** | Check Android logcat: `adb logcat *:S ReactNative:V RNBootstrap:V`. Verify all env vars set on backend. |

---

## Quick Start Summary

```bash
# 1. Build frontend
npm run build

# 2. Initialize Capacitor
npx cap init
# → App: "Global Horizon", Package: "com.globalhorizon.app", Web Dir: "dist"

# 3. Add Android
npx cap add android

# 4. Open in Android Studio
npx cap open android

# 5. Sync changes anytime
npx cap sync

# 6. Build APK in Android Studio (Build → Build APK(s))
```

**Output:** `android/app/build/outputs/apk/debug/app-debug.apk` (ready to test)

---

## Next Steps

1. ✅ Test frontend in browser at `https://yourfrontend.onrender.com`
2. ✅ Register and login
3. ✅ Upload a test photo
4. ✅ Verify feed displays with real data
5. ✅ Run through pre-flight checklist above
6. 🚀 Build APK and install on test device
7. 🚀 Test mobile experience (swipes, upload, feed)
8. 🚀 Publish to Google Play Store
