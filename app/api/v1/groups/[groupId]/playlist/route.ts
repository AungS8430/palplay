import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import getRank from "@/lib/lexorank";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    // Run membership check and playlist fetch in parallel
    const [membership, items] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
        select: { id: true }, // Only select what we need for auth check
      }),
      prisma.groupPlaylistItem.findMany({
        where: {
          groupId: groupId,
        },
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          groupId: true,
          addedById: true,
          spotifyUri: true,
          youtubeId: true,
          title: true,
          artist: true,
          album: true,
          durationSec: true,
          coverUrl: true,
          note: true,
          position: true,
          createdAt: true,
        },
      }),
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const body = await request.json();

  const { title, spotifyUri, youtubeId, coverUrl, artist, album, durationSec } = body;

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

    const lastItem = await prisma.groupPlaylistItem.findMany({
      where: {
        groupId: groupId,
      },
      orderBy: {
        position: "desc",
      },
      take: 1,
    });

    const newItem = await prisma.groupPlaylistItem.create({
      data: {
        groupId: groupId,
        title: title || "Untitled",
        spotifyUri: spotifyUri || null,
        youtubeId: youtubeId || null,
        addedById: userId,
        coverUrl: coverUrl || null,
        artist: artist || null,
        album: album || null,
        durationSec: durationSec || null,
        position: getRank(lastItem.length > 0 ? lastItem[0].position : null, null),
      },
    });

    return NextResponse.json({ newItem });
  } catch (e) {
    return NextResponse.json({ error: "Failed to add playlist item" }, { status: 500 });
  }
}