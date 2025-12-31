"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useSession } from "next-auth/react";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";
import { GroupMember, Group } from "@/lib/types";

// Generate a unique ID for channel names to avoid conflicts between multiple hook instances
function useChannelId(prefix: string, identifier: string) {
  const instanceId = useId();
  const channelIdRef = useRef<string | null>(null);

  if (!channelIdRef.current) {
    // Create a stable unique channel name using instance ID
    const sanitizedInstanceId = instanceId.replace(/:/g, '_');
    channelIdRef.current = `${prefix}:${identifier}:${sanitizedInstanceId}`;
  }

  return channelIdRef.current;
}

export function useRealtimeGroupList() {
  const session = useSession();
  const [groups, setGroups] = useState<GroupMember[]>([]);
  const [connected, setConnected] = useState(false);
  const userId = session.data?.user?.id;
  const channelName = useChannelId("group_members_user", userId || "none");

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      return;
    }

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("group_members")
          .select("id, groupId, userId, role, joinedAt")
          .eq("userId", userId);

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching groups:", error.message || error);
        } else {
          setGroups(data || []);
        }

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
              if (!isMounted) return;

              if (payload.eventType === "INSERT" && payload.new) {
                setGroups(prev => {
                  if (prev.some(g => g.id === payload.new.id)) return prev;
                  return [...prev, payload.new as GroupMember];
                });
              } else if (payload.eventType === "DELETE" && payload.old) {
                setGroups(prev => prev.filter(g => g.id !== payload.old.id));
              } else if (payload.eventType === "UPDATE" && payload.new) {
                setGroups(prev => prev.map(g => g.id === payload.new.id ? payload.new : g));
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (!isMounted) return;
            if (err) {
              console.error("Realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [userId, channelName]);

  return { groups, connected };
}

export function useRealtimeGroupInfo(groupId: string) {
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [connected, setConnected] = useState(false);
  const channelName = useChannelId("groups", groupId || "none");

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("groups")
          .select("id, name, description, isPublic, createdAt")
          .eq("id", groupId)
          .single();

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching group:", error.message || error);
        } else {
          setGroupInfo(data);
        }


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
              if (!isMounted) return;

              if (payload.new) {
                setGroupInfo(payload.new as Group);
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (!isMounted) return;
            if (err) {
              console.error("Group info realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup group info realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId, channelName]);

  return { groupInfo, connected };
}

export function useRealtimeChatMessages(groupId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const channelName = useChannelId("chat_messages", groupId || "none");

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("chat_messages")
          .select("id, groupId, authorId, text, postId, replyToId, spotifyUri, youtubeId, createdAt, editedAt")
          .eq("groupId", groupId)
          .order("createdAt", { ascending: false })
          .limit(100); // Limit initial load for better performance

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching chat messages:", error);
        } else {
          setMessages(data || []);
        }


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
              if (!isMounted) return;

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
            if (!isMounted) return;
            if (err) {
              console.error("Chat messages realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup chat messages realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId, channelName]);

  return { messages, connected };
}

export function useRealtimeGroupMembers(groupId: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const channelName = useChannelId("group_members_group", groupId || "none");

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("group_members")
          .select("id, groupId, userId, role, joinedAt, user:users(id, name, email, image)")
          .eq("groupId", groupId);

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching group members:", error);
        } else {
          setMembers(data || []);
        }


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
              if (!isMounted) return;

              // Refetch all members to get user data
              const { data: refreshedMembers } = await supabaseClient
                .from("group_members")
                .select("id, groupId, userId, role, joinedAt, user:users(id, name, email, image)")
                .eq("groupId", groupId);

              if (refreshedMembers && isMounted) {
                setMembers(refreshedMembers);
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (!isMounted) return;
            if (err) {
              console.error("Group members realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup group members realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId, channelName]);

  return { members, connected };
}

export function useRealtimeJoinRequests(groupId: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const channelName = useChannelId("join_requests", groupId || "none");

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("join_requests")
          .select("id, groupId, userId, message, status, createdAt, user:users(id, name, email, image)")
          .eq("groupId", groupId)
          .eq("status", "pending");

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching join requests:", error);
        } else {
          setRequests(data || []);
        }


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
              if (!isMounted) return;

              // Refetch all pending requests to get user data
              const { data: refreshedRequests } = await supabaseClient
                .from("join_requests")
                .select("id, groupId, userId, message, status, createdAt, user:users(id, name, email, image)")
                .eq("groupId", groupId)
                .eq("status", "pending");

              if (refreshedRequests && isMounted) {
                setRequests(refreshedRequests);
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (!isMounted) return;
            if (err) {
              console.error("Join requests realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup join requests realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId, channelName]);

  return { requests, connected };
}

export function useRealtimeGroupPlaylist(groupId: string) {
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const channelName = useChannelId("group_playlist", groupId || "none");

  useEffect(() => {
    if (!groupId) return;

    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const supabaseClient = await getAuthenticatedSupabaseClient();

        const { data, error } = await supabaseClient
          .from("group_playlist_items")
          .select("id, groupId, addedById, spotifyUri, youtubeId, title, artist, album, durationSec, coverUrl, note, position, createdAt")
          .eq("groupId", groupId)
          .order("position", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching playlist items:", error);
        } else {
          setPlaylistItems(data || []);
        }


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
              if (!isMounted) return;
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
              if (!isMounted) return;
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
              if (!isMounted) return;
              // For DELETE, we filter client-side since payload.old may not include groupId
              if (payload.old && payload.old.id) {
                setPlaylistItems(prev => prev.filter(item => item.id !== payload.old.id));
              }
            }
          )
          .subscribe((status: string, err: any) => {
            if (!isMounted) return;
            if (err) {
              console.error("Playlist realtime subscription error:", err);
            }
            setConnected(status === "SUBSCRIBED");
          });
      } catch (error) {
        console.error("Failed to setup playlist realtime:", error);
        if (isMounted) setConnected(false);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
      setConnected(false);
    };
  }, [groupId, channelName]);

  return { playlistItems, connected };
}