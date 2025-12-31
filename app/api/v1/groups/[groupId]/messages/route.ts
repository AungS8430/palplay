import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    // Run membership check and messages fetch in parallel
    const [membership, messages] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
        select: { id: true }, // Only select what we need for auth check
      }),
      prisma.chatMessage.findMany({
        where: {
          groupId: groupId,
          postId: null,
        },
        orderBy: {
          createdAt: "asc",
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
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { messages },
      {
        headers: {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const body = await request.json();
  const { text, postId, replyToId, spotifyUri, youtubeId } = body;

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

    const newMessage = await prisma.chatMessage.create({
      data: {
        groupId: groupId,
        authorId: userId,
        text: text || undefined,
        postId: postId || undefined,
        replyToId: replyToId || undefined,
        spotifyUri: spotifyUri || undefined,
        youtubeId: youtubeId || undefined,
      },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const messageId = searchParams.get("messageId");

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

    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageId || "",
      },
    });

    if (!message || message.authorId !== userId) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    await prisma.chatMessage.delete({
      where: {
        id: messageId || "",
      },
    });

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const messageId = searchParams.get("messageId");
  const newText = searchParams.get("text");

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

    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageId || "",
      },
    });

    if (!message || message.authorId !== userId) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: messageId || "",
      },
      data: {
        text: newText || message.text,
      },
    });

    return NextResponse.json({ message: updatedMessage });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

