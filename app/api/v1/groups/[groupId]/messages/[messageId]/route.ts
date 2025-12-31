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
    // Run all queries in parallel for better performance
    const [membership, message, reactions] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
        select: { id: true }, // Only select what we need for auth check
      }),
      prisma.chatMessage.findFirst({
        where: {
          id: messageId,
          groupId: groupId,
        },
        select: {
          id: true,
          groupId: true,
          authorId: true,
          text: true,
          postId: true,
          replyToId: true,
          spotifyUri: true,
          youtubeId: true,
          createdAt: true,
          editedAt: true,
        },
      }),
      prisma.reaction.findMany({
        where: {
          targetType: "message",
          targetId: messageId,
        },
        select: {
          id: true,
          userId: true,
          reaction: true,
          createdAt: true,
        },
      }),
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(
      { ...message, reactions },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string, messageId: string }> }) {
  const { groupId, messageId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const text = searchParams.get("text") || "";

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