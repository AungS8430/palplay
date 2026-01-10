"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  getAuthenticatedSupabaseClient,
  refreshSupabaseToken
} from "@/lib/supabase";
import { GroupMember, Group } from "@/lib/types";
import { RealtimeChannel } from "@supabase/supabase-js";

function useChannelId(prefix: string, identifier: string) {
  const channelIdRef = useRef<string | null>(null);
  if (!channelIdRef.current) {
    const sanitizedIdentifier = (identifier || "anon").toString().replace(/:/g, "_");
    channelIdRef.current = `${prefix}:${sanitizedIdentifier}`;
  }
  return channelIdRef.current!;
}

function generateRandomSuffix(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

function findUniqueChannelName(client: any, baseName: string, maxAttempts = 8) {
  const CHANNELS_SYMBOL = Symbol.for("lib.supabase.channels");
  const map = client ? (client[CHANNELS_SYMBOL] as Map<string, any> | undefined) : undefined;

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = `${baseName}:${generateRandomSuffix(8)}`;
    if (map) {
      try {
        if (!map.has(candidate)) return candidate;
      } catch (e) {
        return candidate;
      }
    } else {
      return candidate;
    }
  }

  return `${baseName}:${Date.now()}:${generateRandomSuffix(6)}`;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
      }
    }
  }
  throw lastError!;
}

export async function testRealtimeConnection(table: string, filter: string) {
  try {
    await refreshSupabaseToken();
    const supabase = await getAuthenticatedSupabaseClient();

    const channel = supabase
      .channel(`test_${table}_${Date.now()}`, {
        config: { broadcast: { self: true } }
      })
      .on("postgres_changes", { event: "*", schema: "public", table, filter }, (_payload: any) => {})
      .subscribe((_status: string, _err: any) => {
        if (_status === "SUBSCRIBED") {
          setTimeout(() => channel.unsubscribe(), 5000);
        }
      });

    return channel;
  } catch (error) {
    throw error;
  }
}

function useRealtime<T>({
  table,
  filter,
  selectQuery,
  updateCallback,
  refetchOnChange = false,
  single = false,
  channelPrefix,
  identifier,
  initialLoading = false,
  extraDep
}: {
  table: string;
  filter: string;
  selectQuery: (supabase: any) => any;
  updateCallback?: (prev: T | T[] | null, payload: any) => T | T[] | null;
  refetchOnChange?: boolean;
  single?: boolean;
  channelPrefix: string;
  identifier: string;
  initialLoading?: boolean;
  extraDep?: any;
}): { data: T | T[] | null; connected: boolean; error: Error | null; isLoading?: boolean } {
  const [data, setData] = useState<T | T[] | null>(single ? null : []);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const channelName = useChannelId(channelPrefix, identifier);

  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseClientRef = useRef<any>(null);
  const isSubscribingRef = useRef(false);
  const mountedRef = useRef(true);
  const cleanupTimerRef = useRef<number | null>(null);
  const handlerRef = useRef<(payload: any) => void | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    if (!identifier) {
      setData(single ? null : []);
      setIsLoading(false);
      return;
    }

    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isCleaningUp = false;

    const debouncedRefetch = () => {
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
      refetchTimeoutRef.current = setTimeout(async () => {
        if (!supabaseClientRef.current) return;
        try {
          const { data: refreshedData, error: refetchError } = await selectQuery(supabaseClientRef.current);
          if (refetchError) {
            setError(new Error(refetchError.message || String(refetchError)));
          } else {
            setData(single ? refreshedData : (refreshedData || []));
            setError(null);
          }
        } catch (err) {
          setError(err as Error);
        }
      }, 300);
    };

    const cleanupListener = async () => {
      if (channelRef.current && handlerRef.current) {
        try {
          (channelRef.current as any).off?.(
            "postgres_changes",
            { event: "*", schema: "public", table, filter },
            handlerRef.current
          );
        } catch (err) {}
        handlerRef.current = null;
      }
      isSubscribingRef.current = false;

      try {
        if (channelRef.current) {
          try {
            await channelRef.current.unsubscribe();
          } catch (e) {}
          channelRef.current = null;
        }
      } catch (e) {}
    };

    const scheduleCleanup = () => {
      if (cleanupTimerRef.current) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      const delayMs = 500;
      cleanupTimerRef.current = window.setTimeout(() => {
        cleanupListener().catch(() => {});
        cleanupTimerRef.current = null;
      }, delayMs) as unknown as number;
    };

    const cancelScheduledCleanup = () => {
      if (cleanupTimerRef.current) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };

    const setupRealtime = async () => {
      if (isSubscribingRef.current || isCleaningUp) return;
      isSubscribingRef.current = true;

      cancelScheduledCleanup();

      try {
        setIsLoading(true);
        const token = await refreshSupabaseToken();

        supabaseClientRef.current = await getAuthenticatedSupabaseClient();

        try {
          if (token && supabaseClientRef.current?.realtime?.setAuth) {
            supabaseClientRef.current.realtime.setAuth(token);
          }
        } catch (setErr) {}

        await cleanupListener();

        if (isCleaningUp) return;

        const uniqueName = findUniqueChannelName(supabaseClientRef.current, channelName);
        channelRef.current = supabaseClientRef.current.channel(uniqueName, { config: { broadcast: { self: true } } });

        if (mountedRef.current) {
          try {
            (window as any).__APP_SUPABASE_CLIENT__ = supabaseClientRef.current;
            (window as any).__APP_CHANNEL__ = channelRef.current;
          } catch (e) {}
        }

        handlerRef.current = (payload: any) => {
          if (!mountedRef.current || isCleaningUp) return;

          if (refetchOnChange) {
            debouncedRefetch();
            return;
          }

          if (updateCallback) {
            try {
              setData(prev => updateCallback(prev, payload));
              return;
            } catch (err) {}
          }

          try {
            setData(prev => {
              const prevArr = (prev || []) as any[];
              let next: any;
              if (payload.eventType === "INSERT" && payload.new) {
                if (payload.new.postId) {
                  return prevArr;
                }
                if (prevArr.some((m: any) => m.id === payload.new.id)) {
                  return prevArr;
                }
                next = [payload.new, ...prevArr];
              } else if (payload.eventType === "UPDATE" && payload.new) {
                next = prevArr.map((m: any) => (m.id === payload.new.id ? payload.new : m));
              } else if (payload.eventType === "DELETE" && payload.old) {
                next = prevArr.filter((m: any) => m.id !== payload.old.id);
              } else {
                return prevArr;
              }
              return next;
            });
          } catch (err) {}
        };

        const ch = channelRef.current;
        if (!ch) {
          setIsLoading(false);
          isSubscribingRef.current = false;
          return;
        }

        ch.on("postgres_changes", { event: "*", schema: "public", table, filter }, handlerRef.current);

        await ch.subscribe((status: string, _err: any) => {
          const channelState = (channelRef.current as any)?.state || {};

          if (status === "SUBSCRIBED") {
            setConnected(true);
            setError(null);
            isSubscribingRef.current = false;
            retryCountRef.current = 0;
            if (process.env.NODE_ENV === "development") {
              try {
                (window as any).__APP_SUPABASE_CLIENT__ = supabaseClientRef.current;
                (window as any).__APP_CHANNEL__ = channelRef.current;
                (window as any).__APP_EXPOSED_AT__ = new Date().toISOString();
              } catch (e) {}
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnected(false);
            isSubscribingRef.current = false;
            setError(channelState?.last_error || channelState?.error ? new Error(JSON.stringify(channelState?.last_error || channelState?.error)) : new Error("Subscription failed"));
            if (retryCountRef.current < maxRetries && !isCleaningUp && mountedRef.current) {
              const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
              retryCountRef.current++;
              reconnectTimeout = setTimeout(() => {
                if (!isCleaningUp && mountedRef.current) {
                  cleanupListener().then(setupRealtime).catch(() => {});
                }
              }, delay);
            }
          } else if (status === "CLOSED") {
            setConnected(false);
            isSubscribingRef.current = false;
          }
        });

        const { data: fetchedData, error: fetchError } = await retryWithBackoff(async () => selectQuery(supabaseClientRef.current));
        if (fetchError) {
          setError(new Error(fetchError.message || String(fetchError)));
          setIsLoading(false);
          isSubscribingRef.current = false;
          return;
        }
        setData(single ? fetchedData : (fetchedData || []));
        setError(null);
        setIsLoading(false);

      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
        isSubscribingRef.current = false;
      }
    };

    setupRealtime();

    return () => {
      isCleaningUp = true;
      mountedRef.current = false;

      scheduleCleanup();

      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
        refetchTimeoutRef.current = null;
      }

      setConnected(false);
      isSubscribingRef.current = false;
    };
  }, [identifier, table, filter, single, refetchOnChange, extraDep]);

  return { data, connected, error, isLoading };
}

export function useRealtimeGroupList() {
  const session = useSession();
  const userId = session.data?.user?.id;
  const pathname = usePathname();

  const result = useRealtime<GroupMember>({
    table: "group_members",
    filter: `userId=eq.${userId || ""}`,
    selectQuery: (supabase) => supabase.from("group_members").select("id, groupId, userId, role, joinedAt").eq("userId", userId || ""),
    updateCallback: (prev, payload) => {
      const prevArray = (prev || []) as GroupMember[];
      if (payload.eventType === "INSERT" && payload.new) {
        if (prevArray.some(member => member.id === payload.new.id)) return prevArray;
        return [...prevArray, payload.new];
      } else if (payload.eventType === "UPDATE" && payload.new) {
        return prevArray.map(member => (member.id === payload.new.id ? payload.new : member));
      } else if (payload.eventType === "DELETE" && payload.old) {
        return prevArray.filter(member => member.id !== payload.old.id);
      }
      return prevArray;
    },
    channelPrefix: "group_members_user",
    identifier: userId || "",
    extraDep: pathname
  });

  return { groups: result.data as GroupMember[], connected: result.connected, error: result.error };
}

export function useRealtimeGroupInfo(groupId: string) {
  const result = useRealtime<Group>({
    table: "groups",
    filter: `id=eq.${groupId || ""}`,
    selectQuery: (supabase) => supabase.from("groups").select("id, name, description, isPublic, createdAt").eq("id", groupId || "").single(),
    updateCallback: (prev, payload) => payload.new || prev,
    single: true,
    channelPrefix: "groups",
    identifier: groupId || ""
  });

  return { groupInfo: result.data as Group | null, connected: result.connected, error: result.error };
}

export function useRealtimeChatMessages(groupId: string) {
  const result = useRealtime<any>({
    table: "chat_messages",
    filter: `groupId=eq.${groupId || ""}`,
    selectQuery: (supabase) =>
      supabase
        .from("chat_messages")
        .select("id, groupId, authorId, text, postId, replyToId, spotifyUri, youtubeId, createdAt, editedAt")
        .eq("groupId", groupId || "")
        .is("postId", null)
        .order("createdAt", { ascending: false })
        .limit(100),
    updateCallback: (prev, payload) => {
      const prevArray = (prev || []) as any[];
      if (payload.eventType === "INSERT" && payload.new) {
        if (payload.new.postId) return prevArray;
        if (prevArray.some(msg => msg.id === payload.new.id)) return prevArray;
        return [payload.new, ...prevArray];
      } else if (payload.eventType === "UPDATE" && payload.new) {
        return prevArray.map(msg => (msg.id === payload.new.id ? payload.new : msg));
      } else if (payload.eventType === "DELETE" && payload.old) {
        return prevArray.filter(msg => msg.id !== payload.old.id);
      }
      return prevArray;
    },
    channelPrefix: "chat_messages",
    identifier: groupId || "",
    initialLoading: true
  });

  return { messages: result.data as any[], connected: result.connected, error: result.error, isLoading: result.isLoading };
}

export function useRealtimeGroupMembers(groupId: string) {
  const result = useRealtime<any>({
    table: "group_members",
    filter: `groupId=eq.${groupId || ""}`,
    selectQuery: (supabase) =>
      supabase
        .from("group_members")
        .select("id, groupId, userId, role, joinedAt, user:users(id, name, email, image)")
        .eq("groupId", groupId || ""),
    refetchOnChange: true,
    channelPrefix: "group_members_group",
    identifier: groupId || ""
  });

  return { members: result.data as any[], connected: result.connected, error: result.error };
}

export function useRealtimeJoinRequests(groupId: string) {
  const result = useRealtime<any>({
    table: "join_requests",
    filter: `groupId=eq.${groupId || ""}`,
    selectQuery: (supabase) =>
      supabase
        .from("join_requests")
        .select("id, groupId, userId, message, status, createdAt, user:users(id, name, email, image)")
        .eq("groupId", groupId || "")
        .eq("status", "pending"),
    refetchOnChange: true,
    channelPrefix: "join_requests",
    identifier: groupId || ""
  });

  return { requests: result.data as any[], connected: result.connected, error: result.error };
}

export function useRealtimeGroupPlaylist(groupId: string) {
  const result = useRealtime<any>({
    table: "group_playlist_items",
    filter: `groupId=eq.${groupId || ""}`,
    selectQuery: (supabase) =>
      supabase
        .from("group_playlist_items")
        .select("id, groupId, addedById, spotifyUri, youtubeId, title, artist, album, durationSec, coverUrl, note, position, createdAt")
        .eq("groupId", groupId || "")
        .order("position", { ascending: true }),
    updateCallback: (prev, payload) => {
      const prevArray = (prev || []) as any[];
      let newPrev;
      if (payload.eventType === "INSERT" && payload.new) {
        if (prevArray.some(item => item.id === payload.new.id)) return prevArray;
        newPrev = [...prevArray, payload.new];
      } else if (payload.eventType === "UPDATE" && payload.new) {
        newPrev = prevArray.map(item => (item.id === payload.new.id ? payload.new : item));
      } else if (payload.eventType === "DELETE" && payload.old) {
        newPrev = prevArray.filter(item => item.id !== payload.old.id);
      } else {
        return prevArray;
      }
      return newPrev.sort((a: any, b: any) => Number(a.position ?? 0) - Number(b.position ?? 0));
    },
    channelPrefix: "group_playlist",
    identifier: groupId || "",
    initialLoading: true
  });

  return { playlistItems: result.data as any[], connected: result.connected, error: result.error, isLoading: result.isLoading };
}
