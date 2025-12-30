import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    // Check if user is admin or owner
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    // Validate name
    if (name !== undefined && (!name || typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: updateData,
    });

    return NextResponse.json({ group: updatedGroup, message: "Group updated successfully" });
  } catch (e) {
    console.error("Error updating group:", e);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user,
        role: "owner",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.groupMember.deleteMany({
      where: {
        groupId: groupId,
      },
    });

    await prisma.group.delete({
      where: {
        id: groupId,
      },
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}