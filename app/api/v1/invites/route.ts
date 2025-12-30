import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const searchParams = request.nextUrl.searchParams;

  const inviteCode = searchParams.get("inviteCode");
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invite = await prisma.inviteLink.findFirst({
      where: {
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

    const group = await prisma.group.findUnique({
      where: {
        id: invite.groupId,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ invite, group });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 });
  }
}