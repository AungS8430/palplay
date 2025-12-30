"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";
import { GroupMember, Group } from "@/lib/types";

async function buildChannelName(base: string, identifier: string) {
  const supabaseClient = await getAuthenticatedSupabaseClient();

  // Check auth status
  const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();

  const maxAttempts = 5;
  let currentId = identifier;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // always generate a short identifier before checking
    const short = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    currentId = `${identifier}-${short}`;

    const channels = await supabaseClient.getChannels();
    const channelName = `${base}:${currentId}`;
    const channelExists = channels?.channels?.some((ch: any) => ch.name === channelName);

    if (!channelExists) {
      return channelName;
    }
  }

  // final fallback using a UUID or random string
  const finalId = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

  return `${base}:${identifier}-${finalId}`;
}

export function useRealtimeGroupList() {
  const session = useSession();
  const [groups, setGroups] = useState<GroupMember[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userId = session.data?.user?.id;

    if (!userId) {
      setGroups([]);
      return;
    }

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        // Check auth status
        const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();

        const { data, error } = await supabaseClient
          .from("group_members")
          .select("*")
          .eq("userId", userId);

        if (error) {
          console.error("Error fetching groups:", error.message || error);
        } else {
          setGroups(data || []);
        }

        const channelName = await buildChannelName("group_members", userId);

        console.log(channelName)

        channel = supabaseClient
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: userId }
            }
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "group_members",
              filter: `userId=eq.${userId}`
            },
            async (payload: any) => {
              console.log("=== Realtime Event Received ===");
              console.log("Event type:", payload.eventType);

              if (payload.eventType === "INSERT" && payload.new) {
                setGroups(prev => [...prev, payload.new as GroupMember]);
              } else if (payload.eventType === "DELETE" && payload.old) {
                setGroups(prev => prev.filter(g => g.id !== payload.old.id));
              } else if (payload.eventType === "UPDATE" && payload.new) {
                setGroups(prev => prev.map(g => g.id === payload.new.id ? payload.new : g));
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (err) {
              console.error("Realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [session.data?.user?.id]);

  return { groups, connected };
}

export function useRealtimeGroupInfo(groupId: string) {
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        // Check auth status
        const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();

        const { data, error } = await supabaseClient
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (error) {
          console.error("Error fetching group:", error.message || error);
        } else {
          setGroupInfo(data);
        }

        const channelName = await buildChannelName("groups", groupId);

        console.log(channelName)

        channel = supabaseClient
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: groupId }
            }
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "groups",
              filter: `id=eq.${groupId}`
            },
            async (payload: any) => {
              const { data: newData } = await supabaseClient
                .from("groups")
                .select("*")
                .eq("id", groupId)
                .single();

              setGroupInfo(newData);
            }
          )
          .subscribe((status: string, err: any) => {
            if (err) {
              console.error("Group info realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup group info realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId]);

  return { groupInfo, connected };
}

export function useRealtimeChatMessages(groupId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();

        console.log("=== Chat Messages Setup ===");
        console.log("User ID:", supabaseSession?.user?.id);
        console.log("Group ID:", groupId);

        const { data, error } = await supabaseClient
          .from("chat_messages")
          .select("*")
          .eq("groupId", groupId)
          .order("createdAt", { ascending: false });

        if (error) {
          console.error("Error fetching chat messages:", error);
        } else {
          console.log("Initial messages count:", data?.length);
          setMessages(data || []);
        }

        // Use simple, consistent channel name without random ID
        const channelName = buildChannelName("chat_messages", groupId);
        console.log("Channel name:", channelName);

        channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "chat_messages",
              filter: `groupId=eq.${groupId}`
            },
            (payload: any) => {
              console.log("=== Chat Message Event ===", payload);
              console.log("Event type:", payload.eventType);

              if (payload.eventType === "INSERT" && payload.new) {
                setMessages(prev => {
                  // Prevent duplicates
                  if (prev.some(msg => msg.id === payload.new.id)) {
                    return prev;
                  }
                  return [payload.new as any, ...prev];
                });
              } else if (payload.eventType === "UPDATE" && payload.new) {
                setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
              } else if (payload.eventType === "DELETE" && payload.old) {
                setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
              }
            }
          )
          .subscribe((status: string, err: any) => {
            console.log("Chat subscription status:", status);
            if (err) {
              console.error("Chat messages realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup chat messages realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId]);

  return { messages, connected };
}

export function useRealtimeGroupMembers(groupId: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("group_members")
          .select("*, user:users(*)")
          .eq("groupId", groupId);

        if (error) {
          console.error("Error fetching group members:", error);
        } else {
          setMembers(data || []);
        }

        const channelName = await buildChannelName("group_members", groupId);

        channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "group_members",
              filter: `groupId=eq.${groupId}`
            },
            async (payload: any) => {
              console.log("=== Group Member Event ===", payload);

              // Refetch all members to get user data
              const { data: refreshedMembers } = await supabaseClient
                .from("group_members")
                .select("*, user:users(*)")
                .eq("groupId", groupId);

              if (refreshedMembers) {
                setMembers(refreshedMembers);
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (err) {
              console.error("Group members realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup group members realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId]);

  return { members, connected };
}

export function useRealtimeJoinRequests(groupId: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("join_requests")
          .select("*, user:users(*)")
          .eq("groupId", groupId)
          .eq("status", "pending");

        if (error) {
          console.error("Error fetching join requests:", error);
        } else {
          setRequests(data || []);
        }

        const channelName = await buildChannelName("join_requests", groupId);

        channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "join_requests",
              filter: `groupId=eq.${groupId}`
            },
            async () => {
              // Refetch all pending requests to get user data
              const { data: refreshedRequests } = await supabaseClient
                .from("join_requests")
                .select("*, user:users(*)")
                .eq("groupId", groupId)
                .eq("status", "pending");

              if (refreshedRequests) {
                setRequests(refreshedRequests);
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (err) {
              console.error("Join requests realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup join requests realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId]);

  return { requests, connected };
}

export function useRealtimeGroupPlaylist(groupId: string) {
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("group_playlist_items")
          .select("*")
          .eq("groupId", groupId)
          .order("position", { ascending: true });

        if (error) {
          console.error("Error fetching playlist items:", error);
        } else {
          setPlaylistItems(data || []);
        }

        const channelName = await buildChannelName("group_playlist", groupId);
        console.log(channelName)

        channel = supabaseClient
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "group_playlist_items",
              filter: `groupId=eq.${groupId}`
            },
            (payload: any) => {
              console.log("=== Playlist Item INSERT Event ===", payload);
              if (payload.new) {
                setPlaylistItems(prev => {
                  // Prevent duplicates
                  if (prev.some(item => item.id === payload.new.id)) {
                    return prev;
                  }
                  return [...prev, payload.new as any];
                });
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "group_playlist_items",
              filter: `groupId=eq.${groupId}`
            },
            (payload: any) => {
              console.log("=== Playlist Item UPDATE Event ===", payload);
              if (payload.new) {
                setPlaylistItems(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
              }
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "group_playlist_items"
            },
            (payload: any) => {
              console.log("=== Playlist Item DELETE Event ===", payload);
              // For DELETE, we filter client-side since payload.old may not include groupId
              if (payload.old && payload.old.id) {
                setPlaylistItems(prev => prev.filter(item => item.id !== payload.old.id));
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (err) {
              console.error("Playlist realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup playlist realtime:", error);
        setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId]);

  return { playlistItems, connected };
}