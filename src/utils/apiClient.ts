/**
 * API Client - Centralized fetch wrapper with JWT handling
 * Uses Render URLs via environment variables (VITE_BACKEND_URL)
 */

const API_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://localhost:5000/api';

if (!API_URL.includes('localhost') && !API_URL.startsWith('https://')) {
  console.warn('API_URL should be HTTPS for production:', API_URL);
}

const TOKEN_KEY = 'gh_auth_token';

/**
 * Get stored JWT token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store JWT token in localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Clear stored JWT token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
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
      throw new Error('No authentication token found');
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
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
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
