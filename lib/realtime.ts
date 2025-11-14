"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAuthenticatedSupabaseClient } from "@/lib/supabase";
import { GroupMember, Group } from "@/lib/types";

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

        channel = supabaseClient
          .channel(`group_members:${userId}`, {
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


        channel = supabaseClient
          .channel(`groups:${groupId}`, {
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
