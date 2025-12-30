import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const makeInviteCode = customAlphabet(alphabet, 12);

const expiryOptions: { [key: string]: number } = {
  "30m": 30 * 60,
  "1h": 60 * 60,
  "6h": 6 * 60 * 60,
  "12h": 12 * 60 * 60,
  "1d": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const searchParams = request.nextUrl.searchParams;

  const expiryParam = searchParams.get("expiry");
  const expirySeconds = expiryParam && expiryOptions[expiryParam] ? expiryOptions[expiryParam] : null;

  const oneTimeUse = searchParams.get("oneTimeUse") === "true";

  const expiresAt = expirySeconds ? new Date(Date.now() + expirySeconds * 1000) : null;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    for (let i = 0; i < 5; i++) {
      const code = makeInviteCode();
      try {
        const invite = await prisma.inviteLink.create({
          data: {
            groupId: groupId,
            code: code,
            createdById: user,
            expiresAt: expiresAt || undefined,
            oneTimeUse: oneTimeUse,
          },
        });
        return NextResponse.json({ invite });
      } catch (e: any) {}
    }
    return NextResponse.json({ message: "User invited successfully" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: user,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invites = await prisma.inviteLink.findMany({
      where: {
        groupId: groupId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invites });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch invite links" }, { status: 500 });
  }
}