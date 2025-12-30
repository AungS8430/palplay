"use client";

import { useRealtimeChatMessages } from "@/lib/realtime";
import ChatItem from "./chatItem";
import { useEffect, useState } from "react";

interface MemberData {
  member: any;
  user: any;
}

export default function Messages({ groupId, userId }: { groupId: string; userId: string }) {
  const { messages, connected } = useRealtimeChatMessages(groupId!);
  const [memberDataCache, setMemberDataCache] = useState<Record<string, MemberData>>({});

  useEffect(() => {
    if (!connected || messages.length === 0) return;

    const uniqueAuthorIds = [...new Set(messages.map(msg => msg.authorId))];

    setMemberDataCache(prevCache => {
      const missingAuthorIds = uniqueAuthorIds.filter(id => !prevCache[id]);

      if (missingAuthorIds.length === 0) return prevCache;

      Promise.all(
        missingAuthorIds.map(authorId =>
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
      ).then(results => {
        setMemberDataCache(currentCache => {
          const newCache = { ...currentCache };
          results.forEach(({ authorId, data }) => {
            if (data) {
              newCache[authorId] = data;
            }
          });
          return newCache;
        });
      });

      return prevCache;
    });
  }, [messages, connected, groupId]);

  return (
    <div className="flex flex-col-reverse gap-2 h-[calc(100%-54px)] overflow-scroll">
      {
        connected && messages.map((message) => (
          <ChatItem
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
      }
    </div>
  );
}