import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// Cache for authenticated client
let cachedClient: any = null;
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// Helper to set auth context for RLS and Realtime
export async function getAuthenticatedSupabaseClient() {
  // Check if we have a valid cached token (with 5 minute buffer)
  const now = Date.now();
  if (cachedClient && cachedToken && tokenExpiry && tokenExpiry > now + 300000) {
    console.log("Using cached Supabase client");
    return cachedClient;
  }

  console.log("Fetching new Supabase token");
  const response = await fetch("/api/auth/supabase-token");

  if (!response.ok) {
    console.error("Failed to fetch Supabase token:", response.status, response.statusText);
    throw new Error(`Failed to fetch Supabase token: ${response.status}`);
  }

  const data = await response.json();
  const { token } = data;

  if (!token) {
    console.error("Failed to get Supabase token - token is undefined in response:", data);
    throw new Error("No Supabase token available");
  }

  cachedToken = token;
  tokenExpiry = now + 3600000; // 1 hour

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Set the auth token for realtime connections BEFORE subscribing
  console.log("Setting realtime auth token");
  client.realtime.setAuth(token);

  cachedClient = client;
  return client;
}

// Clear cached client (useful for logout)
export function clearSupabaseClientCache() {
  console.log("Clearing Supabase client cache");
  cachedClient = null;
  cachedToken = null;
  tokenExpiry = null;
}

