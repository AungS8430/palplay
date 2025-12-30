import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST - Approve a join request
export async function POST(request: Request, { params }: { params: Promise<{ groupId: string; requestId: string }> }) {
  const { groupId, requestId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requesterId = (session as any).userId as string;

  try {
    // Check if requester is admin/owner
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: requesterId,
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the join request
    const joinRequest = await prisma.joinRequest.findFirst({
      where: {
        id: requestId,
        groupId: groupId,
        status: 'pending',
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    // Approve the request and add the user as a member
    await prisma.$transaction([
      prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      }),
      prisma.groupMember.create({
        data: {
          groupId: groupId,
          userId: joinRequest.userId,
          role: 'member',
        },
      }),
    ]);

    return NextResponse.json({ message: 'Join request approved successfully' });
  } catch (e) {
    console.error('Error approving join request:', e);
    return NextResponse.json({ error: 'Failed to approve join request' }, { status: 500 });
  }
}

// DELETE - Reject a join request
export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string; requestId: string }> }) {
  const { groupId, requestId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requesterId = (session as any).userId as string;

  try {
    // Check if requester is admin/owner
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: requesterId,
      },
    });

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the join request
    const joinRequest = await prisma.joinRequest.findFirst({
      where: {
        id: requestId,
        groupId: groupId,
        status: 'pending',
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
    }

    // Reject the request
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'rejected' },
    });

    return NextResponse.json({ message: 'Join request rejected' });
  } catch (e) {
    console.error('Error rejecting join request:', e);
    return NextResponse.json({ error: 'Failed to reject join request' }, { status: 500 });
  }
}

