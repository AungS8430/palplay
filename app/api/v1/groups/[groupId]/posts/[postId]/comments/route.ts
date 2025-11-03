import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string; postId: string }> }) {
  const { groupId, postId } = await params;

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comments = await prisma.chatMessage.findMany({
      where: {
        postId: postId,
      },
    });

    return NextResponse.json({ comments });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}