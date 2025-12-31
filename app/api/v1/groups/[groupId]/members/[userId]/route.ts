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
    // Combine both membership checks and user data fetch into fewer queries
    const [requesterMembership, membershipWithUser] = await Promise.all([
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: requesterId,
        },
        select: { id: true }, // Only select what we need
      }),
      prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
        include: {
          user: true, // Include user data in the same query
        },
      }),
    ]);

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!membershipWithUser) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { user, ...member } = membershipWithUser;

    // Add cache headers for member data (cache for 60 seconds, stale-while-revalidate for 5 min)
    return NextResponse.json(
      { member, user },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
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

    // Only owner can change roles
    if (!requesterMembership || requesterMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const membershipToUpdate = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membershipToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (membershipToUpdate.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role directly' }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedMember = await prisma.groupMember.update({
      where: {
        id: membershipToUpdate.id,
      },
      data: {
        role: role,
      },
    });

    return NextResponse.json({ member: updatedMember, message: 'Role updated successfully' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
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