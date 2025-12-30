import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./settingsClient";

export default async function SettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const userId = (session as any).userId as string;

  // Check if user is a member and get their role
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId: groupId,
      userId: userId,
    },
  });

  if (!membership) {
    return <div>Forbidden</div>;
  }

  const isOwner = membership.role === "owner";
  const isAdmin = membership.role === "admin";
  const canManage = isOwner || isAdmin;

  if (!canManage) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-neutral-100 mb-2">Access Denied</h2>
          <p className="text-neutral-400">Only admins and owners can access group settings.</p>
        </div>
      </div>
    );
  }

  return <SettingsClient groupId={groupId} isOwner={isOwner} />;
}

