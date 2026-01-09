/**
 * lib/supabase.ts
 *
 * HMR-safe Supabase helpers and per-client channel cache.
 *
 * - refreshSupabaseToken(): fetches a short-lived JWT from /api/auth/supabase-token
 * - getAuthenticatedSupabaseClient(): returns a global (HMR-safe) authenticated client
 * - getOrCreateChannel(client, name, opts): caches channels per-client via a Symbol key
 * - getActiveChannelCount(client?): debugging helper
 * - clearSupabaseClientCache(): clear clients/channels (logout)
 *
 * Important: your token endpoint should return JSON: { token: "<jwt>" }.
 */

import { createClient, SupabaseClient, RealtimeChannel, RealtimeChannelOptions } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
}

/**
 * HMR-safe globals on globalThis
 * - __SUPABASE_CLIENT__ : the authenticated client used across the app (if created)
 * - __SUPABASE_TOKEN_CACHE__ : token + expiry bookkeeping
 */
declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_CLIENT__: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
  var __SUPABASE_TOKEN_CACHE__: { token: string; expiresAt: number } | undefined;
  // eslint-disable-next-line no-var
  var __SUPABASE_TOKEN_FETCH_PROMISE__: Promise<string> | undefined;
}

// Symbol key used to attach channel map to a client instance (prevents cross-client reuse)
const CHANNELS_SYMBOL = Symbol.for("lib.supabase.channels");
// Symbol key used to attach pending release timers map to a client instance
const PENDING_RELEASES_SYMBOL = Symbol.for("lib.supabase.pending_releases");

// New: channel entry that tracks refCount so shared channels aren't unsubscribed while still in use
type ChannelEntry = { channel: RealtimeChannel; refCount: number };

// Helper to get (and create) a per-client pending release map
function getClientPendingMap(client: SupabaseClient): Map<string, number> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!client[PENDING_RELEASES_SYMBOL]) client[PENDING_RELEASES_SYMBOL] = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return client[PENDING_RELEASES_SYMBOL] as Map<string, number>;
}

/** Minimal token fetcher (deduped) — expects /api/auth/supabase-token -> { token } */
async function fetchSupabaseToken(): Promise<string> {
  if (typeof window === "undefined") throw new Error("fetchSupabaseToken must run in the browser");

  if (globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__) {
    return globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__!;
  }

  globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__ = (async () => {
    const res = await fetch("/api/auth/supabase-token", { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch supabase token: ${res.status}`);
    }
    const json = await res.json();
    if (!json?.token) throw new Error("No token in /api/auth/supabase-token response");
    return json.token as string;
  })();

  try {
    return await globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__;
  } finally {
    globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__ = undefined;
  }
}

/**
 * Refresh token helper (caches token with expiry).
 * Returns token string or null on failure.
 */
export async function refreshSupabaseToken(): Promise<string | null> {
  try {
    const now = Date.now();
    const cache = globalThis.__SUPABASE_TOKEN_CACHE__;
    // If cached and not near expiry, return
    if (cache && cache.expiresAt > now + 300_000) {
      return cache.token;
    }
    const token = await fetchSupabaseToken();
    // cache ~ 1 hour
    globalThis.__SUPABASE_TOKEN_CACHE__ = { token, expiresAt: now + 3_600_000 };
    // If client exists, update realtime auth immediately
    if (globalThis.__SUPABASE_CLIENT__) {
      try {
        globalThis.__SUPABASE_CLIENT__!.realtime.setAuth(token);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[supabase] failed to set realtime auth token:", e);
      }
    }
    return token;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] refreshSupabaseToken failed:", err);
    return null;
  }
}

/**
 * Return (and memoize) an authenticated Supabase client instance.
 * - Creates client and attaches to globalThis.__SUPABASE_CLIENT__ so it survives HMR
 * - Applies Authorization header on creation and updates realtime.setAuth(token) when available
 *
 * Note: This function does NOT automatically fetch token on every call; use refreshSupabaseToken()
 * prior to calling if you want to ensure token is current before subscribing.
 */
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  if (globalThis.__SUPABASE_CLIENT__) {
    return globalThis.__SUPABASE_CLIENT__!;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Try to get a token if possible (non-fatal)
  let token: string | null = null;
  try {
    token = await refreshSupabaseToken();
  } catch (e) {
    token = null;
  }

  // Create a single client instance and store on globalThis to survive HMR
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  // If token exists, set it on realtime (this is critical for RLS/auth on realtime)
  if (token && client?.realtime?.setAuth) {
    try {
      client.realtime.setAuth(token);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[supabase] client.realtime.setAuth failed:", e);
    }
  }

  // attach an empty channel map for this client
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  client[CHANNELS_SYMBOL] = new Map<string, RealtimeChannel>();

  globalThis.__SUPABASE_CLIENT__ = client;
  return client;
}

/** Internal helper: per-client channel map */
function getClientChannelMap(client: SupabaseClient): Map<string, ChannelEntry> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!client[CHANNELS_SYMBOL]) client[CHANNELS_SYMBOL] = new Map<string, ChannelEntry>();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return client[CHANNELS_SYMBOL] as Map<string, ChannelEntry>;
}

/**
 * Acquire (or create) a channel for the given client and increment its refCount.
 * Returns the RealtimeChannel instance.
 */
export function acquireChannel(client: SupabaseClient, channelName: string, opts?: RealtimeChannelOptions): RealtimeChannel {
  try {
    const map = getClientChannelMap(client);
    const existing = map.get(channelName);
    if (existing) {
      existing.refCount++;
      // Cancel any pending release for this channel (grace window)
      try {
        const pending = getClientPendingMap(client);
        const timer = pending.get(channelName);
        if (typeof timer !== "undefined") {
          try {
            (globalThis as any).clearTimeout(timer);
          } catch (e) {
            // ignore
          }
          pending.delete(channelName);
          // eslint-disable-next-line no-console
          console.debug(`[supabase] acquireChannel ${channelName} -> cancelled pending release; refCount=${existing.refCount}`);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug(`[supabase] acquireChannel ${channelName} -> no pending release to cancel`);
      }

      // eslint-disable-next-line no-console
      console.debug(`[supabase] acquireChannel ${channelName} -> refCount=${existing.refCount}`);
      return existing.channel;
    }

    const ch = client.channel(channelName, opts);
    map.set(channelName, { channel: ch, refCount: 1 });
    // eslint-disable-next-line no-console
    console.debug(`[supabase] acquireChannel ${channelName} created -> refCount=1`);
    return ch;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] acquireChannel error:", err);
    // Fallback: still return a raw channel so callers can attempt to use it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return client.channel(channelName, opts) as RealtimeChannel;
  }
}

/**
 * Release a previously acquired channel. Decrements refCount and unsubscribes/deletes
 * the channel when the count reaches zero. To avoid races during quick navigations
 * we schedule a delayed unsubscribe (grace window) which will be cancelled if the
 * channel is re-acquired before the timer fires.
 */
export async function releaseChannel(client: SupabaseClient, channelName: string): Promise<void> {
  try {
    const map = getClientChannelMap(client);
    const entry = map.get(channelName);
    if (!entry) return;
    entry.refCount = Math.max(0, entry.refCount - 1);
    // eslint-disable-next-line no-console
    console.debug(`[supabase] releaseChannel ${channelName} -> refCount=${entry.refCount}`);

    if (entry.refCount <= 0) {
      // schedule delayed unsubscribe instead of immediate
      const pending = getClientPendingMap(client);
      // if an existing pending timer exists, clear it first
      const existingTimer = pending.get(channelName);
      if (typeof existingTimer !== "undefined") {
        try {
          (globalThis as any).clearTimeout(existingTimer);
        } catch (e) {
          // ignore
        }
        pending.delete(channelName);
      }

      const delayMs = 500; // grace window — adjust if needed
      const timer = (globalThis as any).setTimeout(async () => {
        try {
          const cur = map.get(channelName);
          if (!cur) {
            // already removed
            return;
          }
          if (cur.refCount > 0) {
            // reacquired during grace window
            return;
          }
          try {
            await cur.channel.unsubscribe();
            // eslint-disable-next-line no-console
            console.debug(`[supabase] releaseChannel ${channelName} unsubscribed and removed (delayed)`);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[supabase] releaseChannel unsubscribe error (delayed):", e);
          }
          map.delete(channelName);
        } finally {
          // cleanup pending timer entry
          try {
            pending.delete(channelName);
          } catch (e) {
            // ignore
          }
        }
      }, delayMs) as unknown as number;

      pending.set(channelName, timer);
      // eslint-disable-next-line no-console
      console.debug(`[supabase] releaseChannel ${channelName} scheduled unsubscribe in ${delayMs}ms`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] releaseChannel error:", err);
  }
}

/**
 * getOrCreateChannel: caches channels per-client instance using a Symbol key.
 * This prevents a channel created on one client instance from being (incorrectly) reused
 * with another client instance after HMR, which is the root cause of "handler attached but not fired".
 *
 * Backwards-compatible: this will return an existing channel if present but will also
 * increment the reference count so consumers that use acquire/release or this helper
 * remain compatible. Prefer using acquireChannel/releaseChannel for explicit lifecycle.
 */
export function getOrCreateChannel(client: SupabaseClient, channelName: string, opts?: RealtimeChannelOptions): RealtimeChannel {
  // delegate to acquireChannel for consistent ref-counting
  return acquireChannel(client, channelName, opts);
}

/** Remove and unsubscribe a named channel associated with the provided client */
export async function removeChannel(client: SupabaseClient, channelName: string): Promise<void> {
  try {
    const map = getClientChannelMap(client);
    const entry = map.get(channelName);
    if (!entry) return;
    try {
      await entry.channel.unsubscribe();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[supabase] removeChannel unsubscribe error:", e);
    }
    map.delete(channelName);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] removeChannel error:", err);
  }
}

/**
 * getActiveChannelCount: returns number of tracked channels for a client, or for known global client
 */
export function getActiveChannelCount(client?: SupabaseClient): number {
  try {
    if (client) return getClientChannelMap(client).size;
    let count = 0;
    if (globalThis.__SUPABASE_CLIENT__) {
      count += getClientChannelMap(globalThis.__SUPABASE_CLIENT__).size;
    }
    return count;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] getActiveChannelCount error:", err);
    return 0;
  }
}

/** Clear cached client + channels (use on logout) */
export async function clearSupabaseClientCache(): Promise<void> {
  try {
    if (globalThis.__SUPABASE_CLIENT__) {
      const client = globalThis.__SUPABASE_CLIENT__;
      const map = getClientChannelMap(client);
      for (const entry of Array.from(map.values())) {
        try {
          await entry.channel.unsubscribe();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[supabase] error unsubscribing channel during clear:", e);
        }
      }
      map.clear();
      try {
        client.realtime.disconnect();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[supabase] error disconnecting realtime on clear:", e);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[supabase] clearSupabaseClientCache error:", err);
  }

  globalThis.__SUPABASE_CLIENT__ = undefined;
  globalThis.__SUPABASE_TOKEN_CACHE__ = undefined;
  globalThis.__SUPABASE_TOKEN_FETCH_PROMISE__ = undefined;
}