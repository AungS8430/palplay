import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export default async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  const body = await req.json();
  const { name, description, isPublic } = body;

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        isPublic,
      },
    });
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user,
        role: "owner",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}