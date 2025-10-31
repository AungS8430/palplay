import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  const { groupId, userId } = await params;

  const searchParams = request.nextUrl.searchParams;
  const newRole = searchParams.get("role");

  if (!newRole || (newRole !== "member" && newRole !== "admin" && newRole !== "owner")) {
    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (newRole === "owner") {
      if (requesterMembership.role !== "owner") {
        return NextResponse.json({ error: "Only owners can assign owner role" }, { status: 403 });
      }

      const targetMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
      });

      if (targetMembership?.role === "owner") {
        return NextResponse.json({ error: "User is already an owner" }, { status: 400 });
      }

      await prisma.groupMember.updateMany({
        where: {
          groupId: groupId,
          role: "owner",
        },
        data: {
          role: "admin",
        },
      });

      await prisma.groupMember.updateMany({
        where: {
          groupId: groupId,
          userId: userId,
        },
        data: {
          role: "owner",
        },
      });

      return NextResponse.json({ message: "Owner role assigned successfully" });
    } else if (newRole === "admin") {
      if (requesterMembership.role !== "owner") {
        return NextResponse.json({ error: "Only owners can assign admin role" }, { status: 403 });
      }

      await prisma.groupMember.updateMany({
        where: {
          groupId: groupId,
          userId: userId,
        },
        data: {
          role: "admin",
        },
      });

      return NextResponse.json({ message: "Admin role assigned successfully" });
    } else {
      const originalMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: userId,
        },
      });

      if (originalMembership?.role === "owner") {
        if (requesterMembership.role !== "owner") {
          return NextResponse.json({error: "An owner can't be demoted"}, {status: 403});
        }
      } else if (originalMembership?.role === "admin") {
        if (requesterMembership.role !== "owner") {
          return NextResponse.json({error: "Only owners can demote admins"}, {status: 403});
        }
      } else {
        if (requesterMembership.role === "member") {
          return NextResponse.json({ error: "Members can't change roles" }, { status: 403 });
        }
      }

      await prisma.groupMember.updateMany({
        where: {
          groupId: groupId,
          userId: userId,
        },
        data: {
          role: "member",
        },
      });

      return NextResponse.json({ message: "Member role assigned successfully" });
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}