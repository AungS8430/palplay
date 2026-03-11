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
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));

  // Feb 2026 Spotify dev-mode update lowers search max limit to 10.
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 10)
    : 5;
  const offset = Number.isFinite(offsetParam)
    ? Math.max(Math.floor(offsetParam), 0)
    : 0;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!query.trim()) {
    return NextResponse.json([]);
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
    limit: String(limit),
    offset: String(offset),
  }), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 401) {
      return NextResponse.json(
        { error: "Spotify authorization expired. Please sign in again." },
        { status: 401 }
      );
    }

    if (res.status === 403) {
      return NextResponse.json(
        {
          error:
            "Spotify denied access for this app/account in Development Mode. Check app owner Premium status and app user access.",
        },
        { status: 403 }
      );
    }

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
    durationSec: Math.floor(item.duration_ms / 1000),
  })) as Track[];

  return NextResponse.json(processedData);
}

