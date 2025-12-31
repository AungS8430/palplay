"use client";

import { useRealtimeChatMessages } from "@/lib/realtime";
import ChatItem from "./chatItem";
import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";

interface MemberData {
  member: any;
  user: any;
}

// Memoized ChatItem wrapper to prevent unnecessary re-renders
const MemoizedChatItem = memo(ChatItem);

export default function Messages({ groupId, userId }: { groupId: string; userId: string }) {
  const { messages, connected } = useRealtimeChatMessages(groupId!);
  const [memberDataCache, setMemberDataCache] = useState<Record<string, MemberData>>({});
  const pendingFetchRef = useRef<Set<string>>(new Set());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize unique author IDs to prevent recalculation on every render
  const uniqueAuthorIds = useMemo(() =>
    [...new Set(messages.map(msg => msg.authorId))],
    [messages]
  );

  // Batch fetch member data with debouncing to prevent too many requests
  const scheduleFetch = useCallback((authorIds: string[]) => {
    authorIds.forEach(id => pendingFetchRef.current.add(id));

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      const idsToFetch = Array.from(pendingFetchRef.current);
      pendingFetchRef.current.clear();

      if (idsToFetch.length === 0) return;

      const results = await Promise.all(
        idsToFetch.map(authorId =>
          fetch(`/api/v1/groups/${groupId}/members/${authorId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then(res => res.json())
            .then(data => ({ authorId, data }))
            .catch(error => {
              console.error(`Error fetching member data for ${authorId}:`, error);
              return { authorId, data: null };
            })
        )
      );

      setMemberDataCache(currentCache => {
        const newCache = { ...currentCache };
        results.forEach(({ authorId, data }) => {
          if (data) {
            newCache[authorId] = data;
          }
        });
        return newCache;
      });
    }, 50); // Debounce by 50ms to batch requests
  }, [groupId]);

  useEffect(() => {
    if (!connected || messages.length === 0) return;

    const missingAuthorIds = uniqueAuthorIds.filter(id => !memberDataCache[id]);

    if (missingAuthorIds.length === 0) return;

    scheduleFetch(missingAuthorIds);
  }, [uniqueAuthorIds, connected, scheduleFetch, memberDataCache]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the message list to prevent re-rendering when memberDataCache changes
  const messageList = useMemo(() => (
    messages.map((message) => (
      <MemoizedChatItem
        key={message.id}
        messageId={message.id}
        groupId={groupId}
        out={message.authorId == userId}
        text={message.text}
        replyToId={message.replyToId}
        spotifyUri={message.spotifyUri}
        youtubeId={message.youtubeId}
        createdAt={message.createdAt}
        editedAt={message.editedAt}
        memberData={memberDataCache[message.authorId]}
      />
    ))
  ), [messages, groupId, userId, memberDataCache]);

  return (
    <div className="flex flex-col-reverse gap-2 h-[calc(100%-54px)] overflow-scroll">
      {connected && messageList}
    </div>
  );
}