import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Fetch public groups for discovery
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  try {
    // Get groups user is already a member of
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const memberGroupIds = userMemberships.map((m) => m.groupId);

    // Get pending requests
    const pendingRequests = await prisma.joinRequest.findMany({
      where: { userId, status: "pending" },
      select: { groupId: true },
    });
    const pendingGroupIds = pendingRequests.map((r) => r.groupId);

    // Fetch public groups the user is NOT a member of
    const publicGroups = await prisma.group.findMany({
      where: {
        isPublic: true,
        id: { notIn: memberGroupIds },
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Add pending status to each group
    const groupsWithStatus = publicGroups.map((group) => ({
      ...group,
      memberCount: group._count.members,
      hasPendingRequest: pendingGroupIds.includes(group.id),
    }));

    return NextResponse.json({ groups: groupsWithStatus });
  } catch (e) {
    console.error("Error fetching public groups:", e);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  const body = await req.json();
  const { name, description, isPublic } = body;

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        isPublic,
      },
    });
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user,
        role: "owner",
      },
    });

    return NextResponse.json({ message: "Group created successfully", groupId: group.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}