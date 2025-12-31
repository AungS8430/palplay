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
    // Run all independent queries in parallel for better performance
    const [userMemberships, pendingRequests, publicGroups] = await Promise.all([
      // Get groups user is already a member of
      prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      }),
      // Get pending requests
      prisma.joinRequest.findMany({
        where: { userId, status: "pending" },
        select: { groupId: true },
      }),
      // Fetch public groups - we'll filter in memory since we need membership data
      prisma.group.findMany({
        where: {
          isPublic: true,
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          createdAt: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100, // Fetch more, filter less
      }),
    ]);

    const memberGroupIds = new Set(userMemberships.map((m) => m.groupId));
    const pendingGroupIds = new Set(pendingRequests.map((r) => r.groupId));

    // Filter out groups user is already a member of and add status
    const groupsWithStatus = publicGroups
      .filter((group) => !memberGroupIds.has(group.id))
      .slice(0, 50)
      .map((group) => ({
        ...group,
        memberCount: group._count.members,
        hasPendingRequest: pendingGroupIds.has(group.id),
      }));

    return NextResponse.json(
      { groups: groupsWithStatus },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
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