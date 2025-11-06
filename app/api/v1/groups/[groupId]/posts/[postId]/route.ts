import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string, postId: string }> }) {
  const {groupId, postId} = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
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
      return NextResponse.json({error: "Forbidden"}, {status: 403});
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        groupId: groupId,
      },
    });

    const reactions = await prisma.reaction.findMany({
      where: {
        targetType: "post",
        targetId: postId,
      }
    })

    if (!post) {
      return NextResponse.json({error: "Post not found"}, {status: 404});
    }

    return NextResponse.json({ post, reactions });
  } catch (e) {
    return NextResponse.json({error: "Failed to fetch post"}, {status: 500});
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string, postId: string }> }) {
  const { groupId, postId } = await params;

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

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        groupId: groupId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== userId && membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "You do not have permission to delete this post" }, { status: 403 });
    }

    await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        deleted: true,
      },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string, postId: string }> }) {
  const { groupId, postId } = await params;

  const searhParams = request.nextUrl.searchParams;
  const title = searhParams.get("title");
  const caption = searhParams.get("caption");

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

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        groupId: groupId,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== userId) {
      return NextResponse.json({ error: "You do not have permission to edit this post" }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title: title || post.title,
        caption: caption || post.caption,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

