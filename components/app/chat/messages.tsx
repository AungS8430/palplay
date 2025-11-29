"use client";

import { useRealtimeChatMessages } from "@/lib/realtime";
import ChatItem from "./chatItem";

export default function Messages({ groupId, userId }: { groupId: string; userId: string }) {
  const { messages, connected } = useRealtimeChatMessages(groupId!);

  return (
    <div className="flex flex-col-reverse gap-2 h-[calc(100%-54px)] overflow-scroll">
      {
        connected && messages.map((message) => (
          <ChatItem key={message.id} groupId={groupId} out={message.authorId == userId} text={message.text} authorId={message.authorId} replyToId={message.replyToId} spotifyUri={message.spotifyUri} youtubeId={message.youtubeId} createdAt={message.createdAt} editedAt={message.editedAt} />
        ))
      }
    </div>
  );
}