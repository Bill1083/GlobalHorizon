# Blank Screen Fix - Troubleshooting & Deployment Guide

## What Was Wrong

The frontend was showing a **grey blank screen** because of three issues:

### Issue 1: Supabase Client Crash 🔴
**File:** `src/utils/supabaseClient.ts`

The Supabase client initialization was **throwing an error at module load time** if environment variables weren't set:

```typescript
// ❌ OLD CODE - Crashes the entire app
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}
export const supabase = createSupabaseClient();  // Throws immediately
```

This error was happening **before React could render anything**, resulting in a blank page.

### Issue 2: No Null Check in FullscreenFeed 🔴
**File:** `src/components/FullscreenFeed.tsx`

The component was trying to use `supabase` without checking if it was available:

```typescript
// ❌ OLD CODE - Crashes if supabase is null
const subscription = supabase
  .channel('posts:insert')
  .on(...)
  .subscribe();
```

### Issue 3: No Environment Variables Set on Render 🔴
**On Render Dashboard:** Frontend & Backend environment variables were not configured

The API calls were falling back to `http://localhost:5000/api`, which:
- Only works in local development
- Fails on production due to CORS
- Prevents any API communication

---

## What Was Fixed ✅

### Fix 1: Graceful Supabase Initialization
```typescript
// ✅ NEW CODE - Defers initialization and handles missing env vars
export const createSupabaseClient = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables not configured.');
    return null;  // Returns null instead of throwing
  }
  return createClient(...);
};

let supabaseInstance: SupabaseClient | null | undefined;
export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance === undefined) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};
```

### Fix 2: Safe Supabase Usage in Components
```typescript
// ✅ NEW CODE - Checks if supabase is available
if (supabase) {
  const supabaseClient = supabase;
  subscription = supabaseClient
    .channel('posts:insert')
    .on(...)
    .subscribe();
}
```

### Fix 3: Better Environment Variable Logging
```typescript
// ✅ NEW CODE - Helpful warnings for developers
if (!backendUrl) {
  console.warn('⚠️ VITE_BACKEND_URL not configured. Falling back to localhost.');
  if (!isDev) {
    console.warn('📋 Set VITE_BACKEND_URL in Render dashboard to: https://globalhorizon-api-backend.onrender.com/api');
  }
}
```

---

## Next Steps: Set Environment Variables on Render

The app now **shows the login page** even without Realtime (Supabase), but to make everything work, you need to configure environment variables.

### Step 1: Go to Render Frontend Dashboard

1. Open https://dashboard.render.com
2. Select your **Frontend** service (Global Horizon static site)
3. Click **Environment** tab
4. Add these variables:

| Variable | Value |
|----------|-------|
| `VITE_BACKEND_URL` | `https://globalhorizon-api-backend.onrender.com/api` |
| `VITE_SUPABASE_URL` | `https://your-supabase-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (64-char key) |

5. Click **Save Changes**
6. Render will **auto-redeploy** when env vars change

### Step 2: Go to Render Backend Dashboard

1. Open https://dashboard.render.com
2. Select your **Backend** service (globalhorizon-api-backend)
3. Click **Environment** tab
4. These should already be set from ENV_GUIDE.md:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `your-random-secret-key` |
| `FRONTEND_URL` | `https://globalhorizon-qrq4.onrender.com` |
| `SUPABASE_URL` | `https://your-supabase-project.supabase.co` |
| `SUPABASE_KEY` | `eyJ...` (service role key) |
| `REDIS_URL` | `redis://red-d7cuu5n41pts739n3qn0:6379` (or your Render Redis URL) |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | `123456789012345` |
| `CLOUDINARY_API_SECRET` | `your-api-secret` |

### Step 3: Test the App

1. Wait for Render **deployment to complete** (check Service Status)
2. Go to https://globalhorizon-qrq4.onrender.com
3. You should see the **Login Page** ✅
4. Try logging in with test credentials:
   - Email: `test@example.com`
   - Password: `password123`

---

## What to Expect After Fixes

### ✅ Login Page Now Visible
- Grey screen is gone
- Login form should display
- Register button visible

### ✅ Features Work When Env Vars Are Set
- **Auth**: Login/Register (requires backend API)
- **Feed**: Shows posts (requires backend API + Redis caching)
- **Upload**: Upload photos (requires Cloudinary + backend)
- **Realtime**: Live updates (requires Supabase + env vars set)

### ⚠️ Realtime Disabled Until Configured
- If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set
- Feed still works (polls `/api/feed/popular`)
- New posts appear after refresh instead of instantly
- Console shows warning instead of crashing

---

## Where to Find Your Credentials

### Supabase Credentials
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_KEY` (for backend)

### Cloudinary Credentials
1. Open https://cloudinary.com/console
2. Copy:
   - `Cloud name` → `CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

### Render Redis URL
1. Open https://dashboard.render.com
2. Select **Redis** database
3. Copy the **Internal Database URL**
4. Set as `REDIS_URL` in backend

---

## Verify Everything Is Working

### Check Frontend
```bash
curl https://globalhorizon-qrq4.onrender.com
# Should return HTML (not blank)
```

### Check Backend
```bash
curl https://globalhorizon-api-backend.onrender.com/api/health
# Or check if any endpoint returns valid JSON (not CORS error)
```

### Check Console Logs
1. Go to https://globalhorizon-qrq4.onrender.com
2. Open Browser DevTools (F12)
3. Click **Console** tab
4. Look for:
   - ✅ "Successfully connected" messages
   - ⚠️ "Warning" messages about missing env vars (OK if not configured yet)
   - ❌ No red error messages

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Still blank screen | Render deployment incomplete | Wait 2-3 minutes, hard refresh (Ctrl+Shift+R) |
| Login button doesn't work | Backend API unreachable | Set `VITE_BACKEND_URL` on Render |
| Network error "localhost" | Backend URL not set | Set `VITE_BACKEND_URL` to Render backend URL |
| CORS error | Frontend/backend origin mismatch | Add frontend URL to backend CORS settings |
| Realtime not working | Missing Supabase env vars | Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

---

## Files Changed

✅ **src/utils/supabaseClient.ts** - Graceful initialization instead of throwing errors
✅ **src/components/FullscreenFeed.tsx** - Null check for Supabase client
✅ **src/utils/apiClient.ts** - Better logging for missing env vars
✅ **package.json** - npm install added @supabase/supabase-js@^2.39.0

All changes are **backwards compatible** and allow the app to load with or without environment variables.

---

## Summary

1. ✅ **Frontend fixes deployed** - App should no longer show blank screen
2. ⏳ **Environment variables needed** - Set on Render to enable all features
3. ⏳ **Test after deploying** - Verify login page appears, then test auth flow

Once env vars are configured, the full production app should be ready to use!
