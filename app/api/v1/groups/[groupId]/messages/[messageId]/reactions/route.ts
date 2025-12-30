import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reactions = await prisma.reaction.findMany({
      where: {
        targetType: "message",
        targetId: messageId,
      }
    })

    return NextResponse.json({ reactions });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const emoji = searchParams.get("emoji");

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        groupId: groupId,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const reaction = await prisma.reaction.create({
      data: {
        targetType: "message",
        targetId: messageId,
        reaction: emoji || "",
        userId: userId,
      },
    });

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const emoji = searchParams.get("emoji");

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await prisma.reaction.deleteMany({
      where: {
        targetType: "message",
        targetId: messageId,
        reaction: emoji || "",
        userId: userId,
      },
    });

    return NextResponse.json({ deletedCount: deleted.count });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete reaction" }, { status: 500 });
  }
}