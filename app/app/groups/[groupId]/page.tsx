import ChatItem from "@/components/app/chat/chatItem";
import MessageField from "@/components/app/chat/messageField";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params;
  const staticTimestamp = new Date().toISOString();

  return (
    <div className="p-4 h-[calc(100dvh-97px)] flex flex-col-reverse">
      <div className="self-end w-full pt-4">
        <MessageField />
      </div>
      <div className="flex flex-col h-[calc(100%-54px)]">
        <ChatItem key="msg-1" out={true} text="Hello, welcome to the group!" replyToId={""} authorId="a02a8a4e-42eb-427a-9fe9-74a1121ed51a" groupId={groupId} spotifyUri="spotify:track:1NNAI51EuoRWw1ydX1zV7S" youtubeId="N17FXwRWEZs" createdAt={staticTimestamp} />
        <ChatItem key="msg-2" out={false} text="Hello, welcome to the group!" replyToId={""} authorId="a02a8a4e-42eb-427a-9fe9-74a1121ed51a" groupId={groupId} spotifyUri="spotify:track:1NNAI51EuoRWw1ydX1zV7S" youtubeId="N17FXwRWEZs" createdAt={staticTimestamp} />
      </div>
    </div>
  )
}