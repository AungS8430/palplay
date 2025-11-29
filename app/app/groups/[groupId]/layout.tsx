import GroupTabs from "@/components/app/groups/groupTabs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const userId = (session as any).userId as string;

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId: groupId,
      userId: userId,
    },
  });

  if (!membership) {
    return <div>Forbidden</div>;
  }
  return (
    <div className="w-full">
      <GroupTabs groupId={groupId} />
      {children}
    </div>
  )
}