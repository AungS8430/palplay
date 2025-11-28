import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getProviderAccessToken } from "@/lib/crypto";

interface Track {
  title: string;
  spotifyUri: string;
  artist: string;
  album: string;
  coverUrl: string;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "";
  const offset = searchParams.get("offset") || "";

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = (session as any).userId as string;

  const accessToken = await getProviderAccessToken(user, "spotify");

  if (!accessToken) {
    console.error("No Spotify access token available for user:", user);
    return NextResponse.json({ error: "Spotify account not linked" }, { status: 400 });
  }

  console.log("Making Spotify API request with token:", accessToken.substring(0, 20) + "...");

  const res = await fetch("https://api.spotify.com/v1/search?" + new URLSearchParams({
    q: query,
    type: "track",
    limit: limit,
    offset: offset,
  }), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Spotify API error:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText,
      userId: user,
    });
    return NextResponse.json({
      error: "Failed to fetch from Spotify",
      details: errorText,
      status: res.status
    }, { status: res.status });
  }

  const data = await res.json();

  const processedData = data.tracks.items.map((item: any) => ({
    title: item.name,
    spotifyUri: item.uri,
    artist: item.artists.map((artist: any) => artist.name).join(", "),
    album: item.album.name,
    coverUrl: item.album.images[0]?.url || "",
  })) as Track[];

  return NextResponse.json(processedData);
}

