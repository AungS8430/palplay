import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const body = await request.json();

  const { inviteCode } = body;
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of the group" },
        { status: 409 }
      );
    }

    const invite = await prisma.inviteLink.findFirst({
      where: {
        groupId: groupId,
        code: inviteCode,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
    }

    if (!invite.valid) {
      return NextResponse.json({ error: "Invite code is no longer valid" }, { status: 400 });
    }

    await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: user,
        role: "member",
      },
    });

    if (invite.oneTimeUse) {
      await prisma.inviteLink.update({
        where: {
          id: invite.id
        },
        data: {
          valid: false
        },
      });
    }

    return NextResponse.json({ message: "Joined group successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
  }
}