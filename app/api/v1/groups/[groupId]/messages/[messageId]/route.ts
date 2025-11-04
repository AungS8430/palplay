import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const session = await getServerSession();

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

    const reactions = await prisma.reaction.findMany({
      where: {
        targetType: "message",
        targetId: messageId,
      }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ ...message, reactions });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const text = searchParams.get("text") || "";

  const session = await getServerSession();

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

    if (!message || message.authorId !== userId) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: messageId,
      },
      data: {
        text: text || message.text,
      },
    });

    return NextResponse.json({ updatedMessage });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const session = await getServerSession();

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

    if (!message || message.authorId !== userId) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    await prisma.chatMessage.delete({
      where: {
        id: messageId,
        groupId: groupId,
      }
    })

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}