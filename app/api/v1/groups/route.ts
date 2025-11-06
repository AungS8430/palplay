import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
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

    return NextResponse.json({ message: "Group created successfully", groupId: group.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}