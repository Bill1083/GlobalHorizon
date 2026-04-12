/**
 * API Client - Centralized fetch wrapper with JWT handling
 * Uses Render URLs via environment variables (VITE_BACKEND_URL)
 * Gracefully degrades if env vars aren't set
 */

const API_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:5000/api';

// Log environment status at startup
if (typeof window !== 'undefined') {
  const isDev = !import.meta.env.PROD;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn('⚠️ VITE_BACKEND_URL not configured. Falling back to localhost.');
    if (!isDev) {
      console.warn('⚠️ On production, API requests will fail without proper environment variables!');
      console.warn('📋 Set VITE_BACKEND_URL in Render dashboard to: https://globalhorizon-api-backend.onrender.com/api');
    }
  } else if (!API_URL.includes('localhost') && !API_URL.startsWith('https://')) {
    console.warn('⚠️ API_URL should be HTTPS for production:', API_URL);
  }
}

const TOKEN_KEY = 'gh_auth_token';

/**
 * Get stored JWT token from localStorage
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Store JWT token in localStorage
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Failed to store token:', err);
  }
};

/**
 * Clear stored JWT token
 */
export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear token:', err);
  }
};

/**
 * Generic fetch wrapper with JWT header and error handling
 */
export const apiCall = async (
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, any>;
    headers?: Record<string, string>;
    requiresAuth?: boolean;
  } = {}
): Promise<any> => {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = false
  } = options;

  const url = `${API_URL}${endpoint}`;

  // Build headers object
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add JWT token if required
  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders
  };

  // Add body if present
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // Response isn't JSON, use status text
      }
      
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'API request failed';
    console.error(`API Error [${method} ${endpoint}]:`, errorMsg);
    throw error;
  }
};

/**
 * Authentication API calls
 */
export const authAPI = {
  signup: (email: string, password: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: { email, password }
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
};

/**
 * Media API calls
 */
export const mediaAPI = {
  getUploadSignature: () =>
    apiCall('/media/upload-signature', {
      method: 'GET',
      requiresAuth: true
    }),

  createPost: (payload: {
    media_url: string;
    caption: string | null;
    location: string | null;
    media_type: string;
    generate_ai_summary: boolean;
  }) =>
    apiCall('/media/post', {
      method: 'POST',
      body: payload,
      requiresAuth: true
    })
};

/**
 * Feed API calls
 */
export const feedAPI = {
  getPopular: () =>
    apiCall('/feed/popular', {
      method: 'GET'
    })
};
