import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProviderAccessToken } from "@/lib/crypto";

/**
 * Create a new Spotify playlist
 */
async function createSpotifyPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description?: string
): Promise<{ id: string; external_urls: { spotify: string } } | null> {
  try {
    // First get the Spotify user ID
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to get Spotify user:", await userResponse.text());
      return null;
    }

    const userData = await userResponse.json();
    const spotifyUserId = userData.id;

    // Create the playlist
    const response = await fetch(
      `https://api.spotify.com/v1/users/${spotifyUserId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || "Created by PalPlay",
          public: false,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to create Spotify playlist:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Spotify playlist:", error);
    return null;
  }
}

/**
 * Add tracks to a Spotify playlist
 */
async function addTracksToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
): Promise<boolean> {
  try {
    // Spotify allows max 100 tracks per request
    const chunks = [];
    for (let i = 0; i < uris.length; i += 100) {
      chunks.push(uris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: chunk,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to add tracks to Spotify playlist:", await response.text());
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error adding tracks to Spotify playlist:", error);
    return false;
  }
}

/**
 * Replace all tracks in a Spotify playlist (for sync)
 */
async function replaceTracksInSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
): Promise<boolean> {
  try {
    // First, clear the playlist by replacing with empty array
    const clearResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [],
        }),
      }
    );

    if (!clearResponse.ok) {
      console.error("Failed to clear Spotify playlist:", await clearResponse.text());
      return false;
    }

    // Then add all tracks
    if (uris.length > 0) {
      return await addTracksToSpotifyPlaylist(accessToken, playlistId, uris);
    }

    return true;
  } catch (error) {
    console.error("Error replacing tracks in Spotify playlist:", error);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;
  const { groupId } = await params;

  try {
    // Check group membership
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the group info for playlist name
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get Spotify access token
    const accessToken = await getProviderAccessToken(userId, "spotify");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Spotify account not linked" },
        { status: 400 }
      );
    }

    // Get all playlist items with Spotify URIs
    const playlistItems = await prisma.groupPlaylistItem.findMany({
      where: {
        groupId: groupId,
        spotifyUri: { not: null },
      },
      orderBy: {
        position: "asc",
      },
    });

    const spotifyUris = playlistItems
      .map((item) => item.spotifyUri)
      .filter((uri): uri is string => uri !== null);

    // Check if user already has a linked playlist for this group
    let linkedPlaylist = await prisma.groupPlaylistUserLinkedPlaylists.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        provider: "spotify",
      },
    });

    let spotifyPlaylistId: string;
    let isNewPlaylist = false;

    if (linkedPlaylist) {
      // Sync with existing playlist
      spotifyPlaylistId = linkedPlaylist.externalPlaylistId;

      const success = await replaceTracksInSpotifyPlaylist(
        accessToken,
        spotifyPlaylistId,
        spotifyUris
      );

      if (!success) {
        return NextResponse.json(
          { error: "Failed to sync with Spotify playlist" },
          { status: 500 }
        );
      }
    } else {
      // Create a new Spotify playlist
      const playlistName = `${group.name} - PalPlay`;
      const newPlaylist = await createSpotifyPlaylist(
        accessToken,
        userId,
        playlistName,
        group.description || `Collaborative playlist from PalPlay`
      );

      if (!newPlaylist) {
        return NextResponse.json(
          { error: "Failed to create Spotify playlist" },
          { status: 500 }
        );
      }

      spotifyPlaylistId = newPlaylist.id;
      isNewPlaylist = true;

      // Add tracks to the new playlist
      if (spotifyUris.length > 0) {
        const success = await addTracksToSpotifyPlaylist(
          accessToken,
          spotifyPlaylistId,
          spotifyUris
        );

        if (!success) {
          return NextResponse.json(
            { error: "Failed to add tracks to Spotify playlist" },
            { status: 500 }
          );
        }
      }

      // Link the playlist in the database
      linkedPlaylist = await prisma.groupPlaylistUserLinkedPlaylists.create({
        data: {
          groupId: groupId,
          userId: userId,
          provider: "spotify",
          externalPlaylistId: spotifyPlaylistId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isNewPlaylist,
      playlistId: spotifyPlaylistId,
      playlistUrl: `https://open.spotify.com/playlist/${spotifyPlaylistId}`,
      tracksAdded: spotifyUris.length,
      linkedPlaylist,
    });
  } catch (error) {
    console.error("Error syncing playlist to Spotify:", error);
    return NextResponse.json(
      { error: "Failed to sync playlist" },
      { status: 500 }
    );
  }
}

