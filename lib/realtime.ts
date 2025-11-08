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
        console.log("=== Setting up realtime ===");
        console.log("User ID:", userId);

        const supabaseClient = await getAuthenticatedSupabaseClient();

        // Check auth status
        const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();
        console.log("Supabase session:", supabaseSession?.user?.id, sessionError);

        const { data, error } = await supabaseClient
          .from("group_members")
          .select("*")
          .eq("userId", userId);

        if (error) {
          console.error("Error fetching groups:", error.message || error);
        } else {
          console.log("Initial groups:", data?.length);
          setGroups(data || []);
        }

        console.log("Creating channel for group_members table");

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
              console.log("🔔 Realtime event received:", payload.eventType);

              const { data: newData } = await supabaseClient
                .from("group_members")
                .select("*, groups(*)")
                .eq("userId", userId);

              console.log("Updated groups count:", newData?.length);
              setGroups(newData || []);
            }
          )
          .subscribe((status: string, err: any) => {
            console.log("Realtime subscription status:", status);
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
        console.log("=== Setting up group info realtime ===");
        console.log("Group ID:", groupId);

        const supabaseClient = await getAuthenticatedSupabaseClient();

        // Check auth status
        const { data: { session: supabaseSession }, error: sessionError } = await supabaseClient.auth.getSession();
        console.log("Supabase session:", supabaseSession?.user?.id, sessionError);

        const { data, error } = await supabaseClient
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();

        if (error) {
          console.error("Error fetching group:", error.message || error);
        } else {
          console.log("Initial group loaded:", data?.name);
          setGroupInfo(data);
        }

        console.log("Creating channel for groups table");

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
              console.log("🔔 Group info realtime event received:", payload.eventType);

              const { data: newData } = await supabaseClient
                .from("groups")
                .select("*")
                .eq("id", groupId)
                .single();

              console.log("Updated group info:", newData?.name);
              setGroupInfo(newData);
            }
          )
          .subscribe((status: string, err: any) => {
            console.log("Group info realtime subscription status:", status);
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
