# Global Horizon - Frontend API Implementation Guide

Complete fetch examples for all backend API endpoints and Supabase Realtime subscriptions.

---

## Table of Contents

1. [Authentication Flows](#1-authentication-flows)
2. [Cloudinary Upload Flow](#2-cloudinary-upload-flow)
3. [Feed Fetching](#3-feed-fetching)
4. [Supabase Realtime Subscriptions](#4-supabase-realtime-subscriptions)
5. [Error Handling](#5-error-handling)
6. [Complete Integration Example](#6-complete-integration-example)

---

## 1. Authentication Flows

### 1.1 Sign Up (Register New User)

**Endpoint:** `POST /api/auth/signup`

```typescript
// src/utils/apiClient.ts - authAPI.signup()
export const authAPI = {
  signup: (email: string, password: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: { email, password },
      // JWT NOT required - signup is public
    })
};

// Usage in React component
const handleSignup = async (email: string, password: string) => {
  try {
    const response = await authAPI.signup(email, password);
    
    console.log('Signup successful:', response);
    // response = {
    //   message: "User created successfully",
    //   token: "eyJ0eXAiOiJKV1QiLCJhbGc...",  ← Custom JWT
    //   user: {
    //     id: "uuid-here",
    //     email: "user@example.com",
    //     is_admin: false
    //   }
    // }
    
    // Store JWT in localStorage for subsequent requests
    setToken(response.token);
    
    // Frontend automatically includes JWT in header for future API calls
    return response.user;
  } catch (error) {
    console.error('Signup failed:', error.message);
    // Expected errors:
    // - "Email and password required"
    // - "Password must be at least 6 characters"
    // - "User already registered"
  }
};
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

---

### 1.2 Login

**Endpoint:** `POST /api/auth/login`

```typescript
// src/utils/apiClient.ts - authAPI.login()
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: { email, password },
      // JWT NOT required - login is public
    })
};

// Usage in React component
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    
    console.log('Login successful:', response);
    // Same response structure as signup
    
    setToken(response.token);
    return response.user;
  } catch (error) {
    console.error('Login failed:', error.message);
    // Expected errors:
    // - "Email and password required"
    // - "Invalid credentials or server error"
  }
};
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "is_admin": false
  }
}
```

---

## 2. Cloudinary Upload Flow

### 2.1 Get Upload Signature

**Endpoint:** `GET /api/media/upload-signature` (JWT Required)

```typescript
// src/utils/apiClient.ts - mediaAPI.getUploadSignature()
export const mediaAPI = {
  getUploadSignature: () =>
    apiCall('/media/upload-signature', {
      method: 'GET',
      requiresAuth: true  // ← Adds "Authorization: Bearer {token}" header
    })
};

// Usage in UploadPage
const handleGetSignature = async () => {
  try {
    const signature = await mediaAPI.getUploadSignature();
    
    console.log('Got upload signature:', signature);
    // signature = {
    //   cloud_name: "your-cloud-name",
    //   api_key: "your-api-key",
    //   timestamp: 1234567890,
    //   signature: "abc123def456...",  ← SHA-1 hash
    //   public_id: "global-horizon/{user_id}/{timestamp}",
    //   folder: "global-horizon/posts",
    //   upload_url: "https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
    // }
    
    return signature;
  } catch (error) {
    console.error('Failed to get signature:', error.message);
    // Expected errors:
    // - "Token is missing" (if not logged in)
    // - "Token has expired"
  }
};
```

**Response (200 OK):**
```json
{
  "cloud_name": "your-cloud-name",
  "api_key": "123456789012345",
  "timestamp": 1712931200,
  "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "public_id": "global-horizon/550e8400-e29b-41d4-a716-446655440000/1712931200000",
  "folder": "global-horizon/posts",
  "upload_url": "https://api.cloudinary.com/v1_1/your-cloud-name/auto/upload"
}
```

---

### 2.2 Upload Directly to Cloudinary

**Endpoint:** `POST https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload` (Frontend Direct Upload)

```typescript
// src/pages/UploadPage.tsx - Direct upload to Cloudinary (NOT through Flask)
const uploadToCloudinary = async (
  file: File,
  signature: UploadSignature
): Promise<string> => {
  try {
    // Build FormData for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cloud_name', signature.cloud_name);
    formData.append('api_key', signature.api_key);
    formData.append('public_id', signature.public_id);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('resource_type', 'auto');  // Supports both image and video
    
    // Upload directly to Cloudinary (NO JWT needed here)
    const response = await fetch(signature.upload_url, {
      method: 'POST',
      body: formData
      // No Authorization header needed - Cloudinary validates via signature
    });
    
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }
    
    const cloudinaryData = await response.json();
    
    console.log('Upload to Cloudinary successful:', cloudinaryData);
    // cloudinaryData = {
    //   public_id: "global-horizon/user_id/timestamp",
    //   version: 1234567890,
    //   signature: "abc123...",
    //   width: 1920,
    //   height: 1080,
    //   format: "jpg",
    //   resource_type: "image",
    //   created_at: "2024-04-12T10:00:00Z",
    //   tags: [],
    //   bytes: 2097152,
    //   type: "upload",
    //   etag: "abc123...",
    //   placeholder: false,
    //   url: "http://res.cloudinary.com/your-cloud-name/image/upload/...",
    //   secure_url: "https://res.cloudinary.com/your-cloud-name/image/upload/...",  ← Use this!
    //   folder: "global-horizon/posts",
    //   original_filename: "my-photo"
    // }
    
    // Return the secure HTTPS URL
    return cloudinaryData.secure_url;
  } catch (error) {
    console.error('Upload to Cloudinary failed:', error);
    throw error;
  }
};
```

**FormData Payload (Sent to Cloudinary):**
```
file: <File object>
cloud_name: your-cloud-name
api_key: 123456789012345
public_id: global-horizon/{user_id}/{timestamp}
timestamp: 1712931200
signature: a1b2c3d4e5f6... (SHA-1 hash)
resource_type: auto
```

**Cloudinary Response (200 OK):**
```json
{
  "public_id": "global-horizon/550e8400-e29b-41d4-a716-446655440000/1712931200000",
  "version": 1712931200,
  "signature": "abc123...",
  "width": 1920,
  "height": 1080,
  "format": "jpg",
  "resource_type": "image",
  "created_at": "2024-04-12T10:00:00Z",
  "bytes": 2097152,
  "type": "upload",
  "secure_url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1712931200/global-horizon/550e8400-e29b-41d4-a716-446655440000/1712931200000.jpg"
}
```

---

### 2.3 Create Post Record with Media URL

**Endpoint:** `POST /api/media/post` (JWT Required)

```typescript
// src/utils/apiClient.ts - mediaAPI.createPost()
export const mediaAPI = {
  createPost: (payload: {
    media_url: string;
    caption: string | null;
    location: string | null;
    media_type: string;
    generate_ai_summary?: boolean;
  }) =>
    apiCall('/media/post', {
      method: 'POST',
      body: payload,
      requiresAuth: true  // ← Adds JWT header
    })
};

// Usage in UploadPage
const handleCreatePost = async (
  mediaUrl: string,
  caption: string,
  location: string,
  mediaType: string,
  generateAISummary: boolean
) => {
  try {
    const response = await mediaAPI.createPost({
      media_url: mediaUrl,  // From Cloudinary secure_url
      caption: caption || null,
      location: location || null,
      media_type: mediaType,  // "image" or "video"
      generate_ai_summary: generateAISummary  // Boolean flag for AI
    });
    
    console.log('Post created:', response);
    // response = {
    //   message: "Post created successfully",
    //   post: {
    //     id: "uuid-here",
    //     user_id: "uuid-here",
    //     media_url: "https://res.cloudinary.com/...",
    //     caption: "Beautiful sunset",
    //     location: "Bali",
    //     media_type: "image",
    //     ai_summary: {
    //       summary: "Summarized: Beautiful sunset...",  ← Only if generate_ai_summary=true
    //       tags: ["travel", "landscape", "adventure"]
    //     },
    //     likes: 0,
    //     created_at: "2024-04-12T10:00:00Z"
    //   }
    // }
    
    // Redis cache is automatically invalidated on backend
    // New post will appear in feed within 5 minutes or immediately via Realtime
    
    return response.post;
  } catch (error) {
    console.error('Failed to create post:', error.message);
    // Expected errors:
    // - "Media URL required"
    // - "Token is missing"
    // - "Token has expired"
  }
};
```

**Request Body:**
```json
{
  "media_url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1712931200/...",
  "caption": "Beautiful sunset at Bali",
  "location": "Bali, Indonesia",
  "media_type": "image",
  "generate_ai_summary": true
}
```

**Response (201 Created):**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "media_url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1712931200/...",
    "caption": "Beautiful sunset at Bali",
    "location": "Bali, Indonesia",
    "media_type": "image",
    "ai_summary": {
      "summary": "Summarized: Beautiful sunset at Bali...",
      "tags": ["travel", "landscape", "adventure"]
    },
    "likes": 0,
    "created_at": "2024-04-12T10:00:00.000Z"
  }
}
```

---

## 3. Feed Fetching

### 3.1 Get Popular Posts (Cached)

**Endpoint:** `GET /api/feed/popular` (No JWT Required - Public)

```typescript
// src/utils/apiClient.ts - feedAPI.getPopular()
export const feedAPI = {
  getPopular: () =>
    apiCall('/feed/popular', {
      method: 'GET'
      // NO requiresAuth - feed is public
    })
};

// Usage in FullscreenFeed
const handleGetFeed = async () => {
  try {
    const response = await feedAPI.getPopular();
    
    console.log('Feed loaded:', response);
    // response = {
    //   posts: [
    //     {
    //       id: "uuid1",
    //       user_id: "uuid-creator",
    //       media_url: "https://res.cloudinary.com/...",
    //       caption: "Sunset view",
    //       location: "Bali",
    //       media_type: "image",
    //       creator_email: "user@example.com",  ← From join with users table
    //       likes: 42,
    //       created_at: "2024-04-12T10:00:00Z",
    //       ai_summary: { ... } or null
    //     },
    //     { ... more posts ... }
    //   ],
    //   cached: true,  ← Whether result came from Redis cache
    //   cache_ttl: 287  ← Seconds remaining in cache (5-min TTL)
    // }
    
    setFeed(response.posts);
  } catch (error) {
    console.error('Failed to load feed:', error.message);
  }
};
```

**Response (200 OK):**
```json
{
  "posts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "media_url": "https://res.cloudinary.com/...",
      "caption": "Sunset view",
      "location": "Bali, Indonesia",
      "media_type": "image",
      "creator_email": "john@example.com",
      "likes": 42,
      "created_at": "2024-04-12T10:00:00.000Z",
      "ai_summary": null
    }
  ],
  "cached": true,
  "cache_ttl": 287
}
```

---

## 4. Supabase Realtime Subscriptions

### 4.1 Initialize Supabase Client with Custom JWT

**File:** `src/utils/supabaseClient.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getToken } from './apiClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Create Supabase client with custom JWT
 * RLS policies will read user_id, email, is_admin from JWT payload
 */
export const createSupabaseClient = (): SupabaseClient => {
  const token = getToken();  // Get JWT from localStorage
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false  // We manage session with localStorage
    },
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',  // ← Custom JWT
        'X-Client-Info': 'global-horizon/1.0.0'
      }
    }
  });
};

export const supabase = createSupabaseClient();
```

---

### 4.2 Subscribe to Real-Time Post Inserts

**File:** `src/components/FullscreenFeed.tsx`

```typescript
import { useEffect } from 'react';
import { supabase, RealtimePost } from '../utils/supabaseClient';

export function FullscreenFeed({ onUploadClick }) {
  // ... other state ...
  
  useEffect(() => {
    // Load initial feed
    const loadFeed = async () => {
      try {
        const response = await feedAPI.getPopular();
        setFeed(response.posts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };
    
    loadFeed();

    // Subscribe to Realtime INSERT events on posts table
    const subscription = supabase
      .channel('posts:insert')  // Channel name
      .on(
        'postgres_changes',  // PostgreSQL changes event
        {
          event: 'INSERT',  // Only listen for inserts
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          // New post inserted - add to feed immediately
          const newPost = payload.new as RealtimePost;
          
          // Fetch creator email from users table (join)
          supabase
            .from('users')
            .select('email')
            .eq('id', newPost.user_id)
            .single()
            .then(({ data, error: userError }) => {
              if (!userError && data) {
                const postWithCreator: FeedPost = {
                  id: newPost.id,
                  media_url: newPost.media_url,
                  caption: newPost.caption,
                  location: newPost.location,
                  creator_email: data.email,
                  created_at: newPost.created_at,
                  likes: newPost.likes,
                  ai_summary: newPost.ai_summary
                };
                
                // Add to top of feed (most recent first)
                setFeed((prevFeed) => [postWithCreator, ...prevFeed]);
              }
            });
        }
      )
      .subscribe();  // Start listening

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // ... rest of component ...
}
```

**How It Works:**
1. Frontend subscribes to `INSERT` events on `public.posts` table
2. When any user inserts a post, all connected clients receive event
3. New post object is in `payload.new`
4. Join with `users` table to get creator email
5. Add to feed UI immediately (no page reload needed)
6. RLS policy on posts table: `READ` is public (everyone can see), written by user_id match

---

### 4.3 Subscribe to Multiple Events (Optional)

```typescript
// Listen for INSERT, UPDATE, and DELETE
const subscription = supabase
  .channel('posts:all-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // All events
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('Change received:', {
        eventType: payload.eventType,
        newData: payload.new,
        oldData: payload.old
      });
      
      if (payload.eventType === 'INSERT') {
        // Handle insert
      } else if (payload.eventType === 'UPDATE') {
        // Handle update (e.g., likes changed)
      } else if (payload.eventType === 'DELETE') {
        // Handle delete
      }
    }
  )
  .subscribe();
```

---

## 5. Error Handling

### 5.1 Common Error Scenarios

```typescript
// JWT Errors
try {
  await mediaAPI.getUploadSignature();
} catch (error) {
  if (error.message.includes('Token is missing')) {
    // User not logged in - redirect to login
    navigate('/login');
  } else if (error.message.includes('Token has expired')) {
    // Session expired - clear token and redirect
    clearToken();
    navigate('/login');
  }
}

// API Errors
try {
  await mediaAPI.createPost(payload);
} catch (error) {
  if (error.message.includes('Media URL required')) {
    // Validation error - show to user
    setError('Please provide a media URL');
  } else if (error.message.includes('HTTP 500')) {
    // Server error - show generic message
    setError('Server error. Please try again later.');
  }
}

// Network Errors
try {
  const result = await fetch(url, options);
  if (!result.ok) throw new Error(`HTTP ${result.status}`);
} catch (error) {
  if (error instanceof TypeError) {
    // Network error
    console.error('Network error:', error);
  } else {
    // Other error
    console.error('Error:', error);
  }
}
```

---

## 6. Complete Integration Example

**src/pages/UploadPage.tsx** - Full upload flow

```typescript
import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaAPI } from '../utils/apiClient';

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [generateAISummary, setGenerateAISummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');

    try {
      // STEP 1: Get Cloudinary signature from backend (JWT required)
      console.log('Step 1: Fetching Cloudinary signature...');
      const signature = await mediaAPI.getUploadSignature();

      // STEP 2: Upload file directly to Cloudinary (NO backend involved)
      console.log('Step 2: Uploading file to Cloudinary...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('cloud_name', signature.cloud_name);
      formData.append('api_key', signature.api_key);
      formData.append('public_id', signature.public_id);
      formData.append('timestamp', signature.timestamp.toString());
      formData.append('signature', signature.signature);

      const cloudinaryResponse = await fetch(signature.upload_url, {
        method: 'POST',
        body: formData
      });

      if (!cloudinaryResponse.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const mediaUrl = cloudinaryData.secure_url;

      // STEP 3: Create post record in backend (with media URL + optional AI)
      console.log('Step 3: Creating post record...');
      await mediaAPI.createPost({
        media_url: mediaUrl,
        caption: caption || null,
        location: location || null,
        media_type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
        generate_ai_summary: generateAISummary
      });

      // STEP 4: Success - return to feed
      console.log('Upload complete! Redirecting to feed...');
      setIsLoading(false);
      navigate('/app', { replace: true });

      // NOTE: Realtime subscription in FullscreenFeed will automatically
      // display the new post within seconds (no page refresh needed)

    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    }
  };

  // ... form JSX ...
}
```

---

## Summary of API Calls

| Action | Method | Endpoint | Requires JWT | Response |
|--------|--------|----------|---------|----------|
| Sign Up | POST | /api/auth/signup | ❌ | JWT token + user |
| Login | POST | /api/auth/login | ❌ | JWT token + user |
| Get Upload Sig | GET | /api/media/upload-signature | ✅ | Cloudinary params |
| Upload to CDN | POST | https://api.cloudinary.com/.../upload | ❌ | Media URL |
| Create Post | POST | /api/media/post | ✅ | Post record |
| Get Feed | GET | /api/feed/popular | ❌ | Posts array |
| Realtime Posts | WS | supabase.on('postgres_changes') | ✅(JWT) | Real-time events |

---

## Database Operations via Realtime

```typescript
// Subscribe to new posts
supabase
  .channel('posts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, callback)
  .subscribe();

// Listen for likes changes
supabase
  .channel('posts:updates')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, callback)
  .subscribe();

// Query posts directly (with RLS applied via JWT)
const { data, error } = await supabase
  .from('posts')
  .select('*, users(email)')
  .order('created_at', { ascending: false })
  .limit(50);
```

**All queries respect RLS policies defined in SCHEMA.sql**
