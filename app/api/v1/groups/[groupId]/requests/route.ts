import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Fetch all pending join requests for a group (admin/owner only)
export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

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

    const requests = await prisma.joinRequest.findMany({
      where: {
        groupId: groupId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ requests });
  } catch (e) {
    console.error('Error fetching join requests:', e);
    return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 });
  }
}

// POST - Create a join request for a public group
export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    // Check if group exists and is public
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.isPublic) {
      return NextResponse.json({ error: 'This group is private. You need an invite to join.' }, { status: 403 });
    }

    // Check if already a member
    const existingMembership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request for this group' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { message } = body;

    const joinRequest = await prisma.joinRequest.create({
      data: {
        groupId: groupId,
        userId: userId,
        message: message || null,
      },
    });

    return NextResponse.json({ message: 'Join request submitted successfully', request: joinRequest });
  } catch (e) {
    console.error('Error creating join request:', e);
    return NextResponse.json({ error: 'Failed to submit join request' }, { status: 500 });
  }
}

