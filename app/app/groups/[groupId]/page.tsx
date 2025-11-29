import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";``
import MessageField from "@/components/app/chat/messageField";
import Messages from "@/components/app/chat/messages";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  if (!groupId) {
    return null
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const userId = (session as any).userId as string;
  return (
    <div className="p-4 h-[calc(100dvh-97px)] flex flex-col-reverse">
      <div className="self-end w-full pt-4">
        <MessageField groupId={groupId} />
      </div>
      <Messages groupId={groupId} userId={userId} />
    </div>
  )
}