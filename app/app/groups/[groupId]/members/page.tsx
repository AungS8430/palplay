import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import MembersClient from "./membersClient";

export default async function MembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const userId = (session as any).userId as string;

  return <MembersClient groupId={groupId} currentUserId={userId} />;
}
