import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  const { groupId, userId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requesterId = (session as any).userId as string;

  try {
    // Check if requester is the owner
    const requesterMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: requesterId,
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can transfer ownership' }, { status: 403 });
    }

    // Find the target member
    const targetMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMembership.userId === requesterId) {
      return NextResponse.json({ error: 'Cannot transfer ownership to yourself' }, { status: 400 });
    }

    // Transfer ownership using a transaction
    await prisma.$transaction([
      // Make the current owner an admin
      prisma.groupMember.update({
        where: {
          id: requesterMembership.id,
        },
        data: {
          role: 'admin',
        },
      }),
      // Make the target member the new owner
      prisma.groupMember.update({
        where: {
          id: targetMembership.id,
        },
        data: {
          role: 'owner',
        },
      }),
    ]);

    return NextResponse.json({ message: 'Ownership transferred successfully' });
  } catch (e) {
    console.error('Error transferring ownership:', e);
    return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
  }
}
