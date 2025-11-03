import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import getRank from "@/lib/lexorank";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string, itemId: string }> }) {
  const { groupId, itemId } = await params;

  const searchParams = new URL(request.url).searchParams;

  const beforeId = searchParams.get("beforeId");
  const afterId = searchParams.get("afterId");

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

    let newPosition: string;

    const beforeItem = beforeId ? await prisma.groupPlaylistItem.findUnique({ where: { id: beforeId } }) : null;
    const afterItem = afterId ? await prisma.groupPlaylistItem.findUnique({ where: { id: afterId } }) : null;

    if (beforeItem && afterItem) {
      newPosition = getRank(afterItem.position, beforeItem.position);
    } else if (beforeItem) {
      newPosition = getRank(null, beforeItem.position);
    } else if (afterItem) {
      newPosition = getRank(afterItem.position, null);
    } else {
      return NextResponse.json({ error: "At least one of beforeId or afterId must be provided" }, { status: 400 });
    }

    await prisma.groupPlaylistItem.updateMany({
      where: {
        id: itemId,
        groupId: groupId,
      },
      data: {
        position: newPosition,
      },
    });

    return NextResponse.json({ message: "Playlist item reordered successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reorder playlist item" }, { status: 500 });
  }
}