import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import getRank from "@/lib/lexorank";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string, itemId: string }> }) {
  const { groupId, itemId } = await params;

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

    await prisma.groupPlaylistItem.deleteMany({
      where: {
        id: itemId,
        groupId: groupId,
      },
    });

    return NextResponse.json({ message: "Playlist item deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete playlist item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string, itemId: string }> }) {
  const { groupId, itemId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const title = searchParams.get("title");
  const spotifyUri = searchParams.get("spotifyUri");
  const youtubeId = searchParams.get("youtubeId");

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

    await prisma.groupPlaylistItem.updateMany({
      where: {
        id: itemId,
        groupId: groupId,
      },
      data: {
        title: title || undefined,
        spotifyUri: spotifyUri || undefined,
        youtubeId: youtubeId || undefined,
      },
    });

    return NextResponse.json({ message: "Playlist item updated successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update playlist item" }, { status: 500 });
  }
}