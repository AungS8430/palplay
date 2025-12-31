import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    // Combine membership check and member fetch into parallel queries
    const [membership, members] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: user,
        },
        select: { id: true }, // Only select what we need for auth check
      }),
      prisma.groupMember.findMany({
        where: {
          groupId: groupId,
        },
        include: {
          user: {
            select: { id: true, name: true, image: true, email: true }, // Only select needed fields
          },
        },
      }),
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { members },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session as any).userId as string;


  try {
    const membershipToDelete = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membershipToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (membershipToDelete.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner of the group' }, { status: 403 });
    }

    await prisma.groupMember.delete({
      where: {
        id: membershipToDelete.id,
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}