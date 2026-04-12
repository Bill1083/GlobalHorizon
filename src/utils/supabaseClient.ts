/**
 * Supabase Realtime Client
 * Initializes Supabase client with custom JWT for RLS policies
 * Allows real-time WebSocket subscriptions for live feed updates
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getToken } from './apiClient';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined);
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

/**
 * Create Supabase client with custom JWT authentication
 * RLS policies will use the JWT payload (user_id, email) from our custom JWT
 * Deferred initialization to avoid app crash if env vars are missing
 */
export const createSupabaseClient = (): SupabaseClient | null => {
  // Gracefully handle missing env vars - allow app to load even without Realtime
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase environment variables not configured. Real-time feed updates disabled.');
    console.warn('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live updates.');
    return null;
  }

  const token = getToken();
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false // We handle session with localStorage
    },
    global: {
      headers: {
        // Pass custom JWT to Supabase for RLS policies
        Authorization: token ? `Bearer ${token}` : '',
        'X-Client-Info': 'global-horizon/1.0.0'
      }
    }
  });
};

/**
 * Lazy-initialized Supabase client instance
 * Only created when first accessed
 */
let supabaseInstance: SupabaseClient | null | undefined;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance === undefined) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
};

/**
 * Compatibility export - provides supabase instance or null
 */
export const supabase = getSupabase();

/**
 * Subscribe to real-time post updates
 * Listens for INSERT events on posts table
 * Decodes JWT to get user_id for RLS filtering
 */
export type RealtimePost = {
  id: string;
  user_id: string;
  media_url: string;
  caption?: string;
  location?: string;
  media_type: string;
  ai_summary?: object;
  likes: number;
  created_at: string;
  creator_email?: string;
};

/**
 * Helpers for RLS policies
 * These allow us to write policies that respect custom JWT
 */
export const getUserIdFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  } catch {
    return null;
  }
};

export const getEmailFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email;
  } catch {
    return null;
  }
};
