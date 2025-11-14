import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  const { groupId, userId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requesterId = (session as any).userId as string;

  try {
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: requesterId,
      },
    });

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ member: membership });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  const { groupId, userId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requesterId = (session as any).userId as string;

  try {
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: requesterId,
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      return NextResponse.json({ error: 'Cannot remove the owner of the group' }, { status: 400 });
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