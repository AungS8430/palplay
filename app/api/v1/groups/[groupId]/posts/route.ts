import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const searhParams = req.nextUrl.searchParams;
  const spotifyUri = searhParams.get("spotifyUri");
  const youtubeId = searhParams.get("youtubeId");
  const title = searhParams.get("title");
  const caption = searhParams.get("caption");
  const highlightStartSeconds = searhParams.get("highlightStartSeconds");
  const highlightEndSeconds = searhParams.get("highlightEndSeconds");

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

    const post = await prisma.post.create({
      data: {
        groupId: groupId,
        authorId: userId,
        spotifyUri: spotifyUri || null,
        youtubeId: youtubeId || null,
        title: title || null,
        caption: caption || null,
        highlightStartSeconds: highlightStartSeconds ? parseInt(highlightStartSeconds) : null,
        highlightEndSeconds: highlightEndSeconds ? parseInt(highlightEndSeconds) : null,
      },
    });

    return NextResponse.json({ post });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 20;
  const offsetParam = searchParams.get("offset");
  const offset = offsetParam ? parseInt(offsetParam) : 0;

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

    const posts = await prisma.post.findMany({
      where: {
        groupId: groupId,
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    const count = await prisma.post.count({
      where: {
        groupId: groupId,
        deleted: false,
      },
    });

    return NextResponse.json({ count, posts });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

