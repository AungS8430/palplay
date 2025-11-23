import ChatItem from "@/components/app/chat/chatItem";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params;
  return (
    <div className="p-4 w-full">
      <ChatItem out={true} text="Hello, welcome to the group!" replyToId={""} authorId="a02a8a4e-42eb-427a-9fe9-74a1121ed51a" groupId={groupId} authorId="a02a8a4e-42eb-427a-9fe9-74a1121ed51a" groupId={groupId} spotifyUri="spotify:track:1NNAI51EuoRWw1ydX1zV7S" youtubeId="N17FXwRWEZs" />
      <ChatItem out={false} text="Hello, welcome to the group!" replyToId={""} authorId="a02a8a4e-42eb-427a-9fe9-74a1121ed51a" groupId={groupId} spotifyUri="spotify:track:1NNAI51EuoRWw1ydX1zV7S" youtubeId="N17FXwRWEZs" />
    </div>
  )
}