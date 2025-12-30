import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import getRank from "@/lib/lexorank";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  const { groupId } = await params;

  const body = await request.json();
  const { playlistId, provider } = body;

  if (!playlistId || !provider) {
    return NextResponse.json({ error: "Missing playlistId or provider" }, { status: 400 });
  }

  try {
    const newLinkedPlaylist = await prisma.groupPlaylistUserLinkedPlaylists.create({
      data: {
        groupId: groupId,
        userId: userId,
        externalPlaylistId: playlistId ,
        provider: provider,
      },
    });

    return NextResponse.json({ linkedPlaylist: newLinkedPlaylist });
  } catch (e) {
    return NextResponse.json({ error: "Failed to link playlist" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

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

    const playlists = await prisma.groupPlaylistUserLinkedPlaylists.findMany({
      where: {
        groupId: groupId,
        userId: userId
      },
    });
    return NextResponse.json({ playlists });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch linked playlists" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  const body = await request.json();
  const { playlistId, provider, id } = body;

  if (!playlistId || !provider || !id) {
    return NextResponse.json({ error: "Missing playlistId, provider or id" }, { status: 400 });
  }

  try {
    const updatedLinkedPlaylist = await prisma.groupPlaylistUserLinkedPlaylists.updateMany({
      where: {
        id: id,
        groupId: groupId,
        userId: userId
      },
      data: {
        externalPlaylistId: playlistId ,
        provider: provider,
      },
    });

    return NextResponse.json({ linkedPlaylist: updatedLinkedPlaylist });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update linked playlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.groupPlaylistUserLinkedPlaylists.deleteMany({
      where: {
        id: id,
        groupId: groupId,
        userId: userId
      },
    });

    return NextResponse.json({ message: "Linked playlist deleted successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete linked playlist" }, { status: 500 });
  }
}