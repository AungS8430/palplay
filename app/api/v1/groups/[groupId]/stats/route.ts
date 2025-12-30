import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProviderAccessToken } from "@/lib/crypto";

// Spotify API types
interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string }[];
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images?: { url: string }[];
  artists: SpotifyArtist[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
  total: number;
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
}

interface SpotifyRecentlyPlayedResponse {
  items: {
    track: SpotifyTrack;
    played_at: string;
  }[];
}

async function fetchSpotifyTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 50
): Promise<SpotifyTrack[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch top tracks:", response.status);
      return [];
    }

    const data: SpotifyTopTracksResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return [];
  }
}

async function fetchSpotifyTopArtists(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit: number = 50
): Promise<SpotifyArtist[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch top artists:", response.status);
      return [];
    }

    const data: SpotifyTopArtistsResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return [];
  }
}

async function fetchSpotifyRecentlyPlayed(
  accessToken: string,
  limit: number = 50
): Promise<{ track: SpotifyTrack; played_at: string }[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch recently played:", response.status);
      return [];
    }

    const data: SpotifyRecentlyPlayedResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching recently played:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  try {
    // Check membership
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get group members with their info
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Aggregate data structures
    const artistListenCounts: Record<
      string,
      {
        name: string;
        count: number;
        imageUrl: string | null;
        listeners: Set<string>;
      }
    > = {};

    const albumListenCounts: Record<
      string,
      {
        name: string;
        artist: string;
        count: number;
        coverUrl: string | null;
        listeners: Set<string>;
      }
    > = {};

    const songListenCounts: Record<
      string,
      {
        id: string;
        name: string;
        artist: string;
        album: string;
        coverUrl: string | null;
        durationMs: number;
        count: number;
        listeners: Set<string>;
      }
    > = {};

    const memberStats: Record<
      string,
      {
        totalListeningMs: number;
        topTracksCount: number;
        recentPlaysCount: number;
        hasSpotifyConnected: boolean;
      }
    > = {};

    let totalListeningMs = 0;
    let totalTracksAnalyzed = 0;
    let membersWithSpotify = 0;

    // Fetch Spotify data for each member
    for (const member of members) {
      const accessToken = await getProviderAccessToken(member.userId, "spotify");

      memberStats[member.userId] = {
        totalListeningMs: 0,
        topTracksCount: 0,
        recentPlaysCount: 0,
        hasSpotifyConnected: !!accessToken,
      };

      if (!accessToken) {
        continue;
      }

      membersWithSpotify++;

      // Fetch top tracks (medium term - last 6 months)
      const topTracks = await fetchSpotifyTopTracks(accessToken, "medium_term", 50);

      // Fetch recently played
      const recentlyPlayed = await fetchSpotifyRecentlyPlayed(accessToken, 50);

      memberStats[member.userId].topTracksCount = topTracks.length;
      memberStats[member.userId].recentPlaysCount = recentlyPlayed.length;

      // Process top tracks with weighted scoring (higher ranked = more listens estimated)
      topTracks.forEach((track, index) => {
        const weight = 50 - index; // Higher rank = more weight
        const trackKey = track.id;
        const artistNames = track.artists.map((a) => a.name).join(", ");

        // Track songs
        if (!songListenCounts[trackKey]) {
          songListenCounts[trackKey] = {
            id: track.id,
            name: track.name,
            artist: artistNames,
            album: track.album.name,
            coverUrl: track.album.images?.[0]?.url || null,
            durationMs: track.duration_ms,
            count: 0,
            listeners: new Set(),
          };
        }
        songListenCounts[trackKey].count += weight;
        songListenCounts[trackKey].listeners.add(member.userId);

        // Track albums
        const albumKey = track.album.id;
        if (!albumListenCounts[albumKey]) {
          albumListenCounts[albumKey] = {
            name: track.album.name,
            artist: track.album.artists.map((a) => a.name).join(", "),
            count: 0,
            coverUrl: track.album.images?.[0]?.url || null,
            listeners: new Set(),
          };
        }
        albumListenCounts[albumKey].count += weight;
        albumListenCounts[albumKey].listeners.add(member.userId);

        // Track artists
        track.artists.forEach((artist) => {
          if (!artistListenCounts[artist.id]) {
            artistListenCounts[artist.id] = {
              name: artist.name,
              count: 0,
              imageUrl: null,
              listeners: new Set(),
            };
          }
          artistListenCounts[artist.id].count += weight;
          artistListenCounts[artist.id].listeners.add(member.userId);
        });

        // Estimate listening time (weighted by rank)
        const estimatedPlays = weight;
        memberStats[member.userId].totalListeningMs += track.duration_ms * estimatedPlays;
        totalListeningMs += track.duration_ms * estimatedPlays;
        totalTracksAnalyzed++;
      });

      // Process recently played (each play counts as 1)
      recentlyPlayed.forEach(({ track }) => {
        const trackKey = track.id;
        const artistNames = track.artists.map((a) => a.name).join(", ");

        if (!songListenCounts[trackKey]) {
          songListenCounts[trackKey] = {
            id: track.id,
            name: track.name,
            artist: artistNames,
            album: track.album.name,
            coverUrl: track.album.images?.[0]?.url || null,
            durationMs: track.duration_ms,
            count: 0,
            listeners: new Set(),
          };
        }
        songListenCounts[trackKey].count += 5; // Recent plays get extra weight
        songListenCounts[trackKey].listeners.add(member.userId);

        // Track albums
        const albumKey = track.album.id;
        if (!albumListenCounts[albumKey]) {
          albumListenCounts[albumKey] = {
            name: track.album.name,
            artist: track.album.artists.map((a) => a.name).join(", "),
            count: 0,
            coverUrl: track.album.images?.[0]?.url || null,
            listeners: new Set(),
          };
        }
        albumListenCounts[albumKey].count += 5;
        albumListenCounts[albumKey].listeners.add(member.userId);

        // Track artists
        track.artists.forEach((artist) => {
          if (!artistListenCounts[artist.id]) {
            artistListenCounts[artist.id] = {
              name: artist.name,
              count: 0,
              imageUrl: null,
              listeners: new Set(),
            };
          }
          artistListenCounts[artist.id].count += 5;
          artistListenCounts[artist.id].listeners.add(member.userId);
        });

        memberStats[member.userId].totalListeningMs += track.duration_ms;
        totalListeningMs += track.duration_ms;
      });
    }

    // Fetch top artists for images
    for (const member of members) {
      const accessToken = await getProviderAccessToken(member.userId, "spotify");
      if (!accessToken) continue;

      const topArtists = await fetchSpotifyTopArtists(accessToken, "medium_term", 50);
      topArtists.forEach((artist) => {
        if (artistListenCounts[artist.id] && artist.images?.[0]?.url) {
          artistListenCounts[artist.id].imageUrl = artist.images[0].url;
        }
      });
    }

    // Convert to sorted arrays
    const topArtists = Object.values(artistListenCounts)
      .map((artist) => ({
        name: artist.name,
        count: artist.count,
        imageUrl: artist.imageUrl,
        listenerCount: artist.listeners.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topAlbums = Object.values(albumListenCounts)
      .map((album) => ({
        name: album.name,
        artist: album.artist,
        count: album.count,
        coverUrl: album.coverUrl,
        listenerCount: album.listeners.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topSongs = Object.values(songListenCounts)
      .map((song) => ({
        id: song.id,
        name: song.name,
        artist: song.artist,
        album: song.album,
        coverUrl: song.coverUrl,
        durationMs: song.durationMs,
        count: song.count,
        listenerCount: song.listeners.size,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Build leaderboard based on listening time
    const leaderboard = members
      .map((member) => ({
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt,
        totalListeningMs: memberStats[member.userId]?.totalListeningMs || 0,
        topTracksCount: memberStats[member.userId]?.topTracksCount || 0,
        hasSpotifyConnected: memberStats[member.userId]?.hasSpotifyConnected || false,
      }))
      .sort((a, b) => b.totalListeningMs - a.totalListeningMs);

    // Convert total listening time to seconds
    const totalListeningSec = Math.round(totalListeningMs / 1000);

    return NextResponse.json({
      totalMembers: members.length,
      membersWithSpotify,
      totalListeningSec,
      totalTracksAnalyzed,
      topArtists,
      topAlbums,
      topSongs,
      leaderboard,
    });
  } catch (e) {
    console.error("Error fetching stats:", e);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
