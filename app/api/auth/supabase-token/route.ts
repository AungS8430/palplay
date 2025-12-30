import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.error("No session found when requesting Supabase token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = {
      sub: session.user.id,
      role: "authenticated",
      aud: "authenticated",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const token = jwt.sign(
      payload,
      SUPABASE_JWT_SECRET,
      { algorithm: "HS256" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating Supabase token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
