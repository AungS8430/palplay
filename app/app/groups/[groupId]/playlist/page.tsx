"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRealtimeGroupPlaylist } from "@/lib/realtime";
import PlaylistHeader from "@/components/app/playlist/header";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SpotifyIcon from "@/components/icons/spotify";
import YoutubeIcon from "@/components/icons/youtube";
import { EllipsisVertical, Search, Plus, Trash, RefreshCw, ExternalLink, Music } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function GroupPlaylistItem({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [playlistFilter, setPlaylistFilter] = useState("");
  const { playlistItems, connected } = useRealtimeGroupPlaylist(groupId);

  // Filter playlist items based on search
  const filteredPlaylistItems = playlistItems.filter((item) => {
    if (!playlistFilter) return true;
    const searchLower = playlistFilter.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.artist?.toLowerCase().includes(searchLower) ||
      item.album?.toLowerCase().includes(searchLower)
    );
  });

  // Spotify sync state
  const [linkedPlaylist, setLinkedPlaylist] = useState<{
    id: string;
    externalPlaylistId: string;
    provider: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Fetch linked playlist on mount
  useEffect(() => {
    const fetchLinkedPlaylist = async () => {
      try {
        const response = await fetch(`/api/v1/groups/${groupId}/linkedplaylists`);
        if (response.ok) {
          const data = await response.json();
          const spotifyPlaylist = data.playlists?.find(
            (p: any) => p.provider === "spotify"
          );
          setLinkedPlaylist(spotifyPlaylist || null);
        }
      } catch (error) {
        console.error("Error fetching linked playlists:", error);
      }
    };

    fetchLinkedPlaylist();
  }, [groupId]);

  // Handle Spotify sync
  const handleSpotifySync = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/linkedplaylists/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLinkedPlaylist(data.linkedPlaylist);
        // Open the Spotify playlist in a new tab
        window.open(data.playlistUrl, "_blank");
      } else {
        const errorData = await response.json();
        setSyncError(errorData.error || "Failed to sync with Spotify");
      }
    } catch (error) {
      console.error("Error syncing with Spotify:", error);
      setSyncError("Failed to sync with Spotify");
    } finally {
      setIsSyncing(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/v1/songs/search?q=${encodeURIComponent(searchQuery)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
          console.log(data)
        } else {
          console.error("Error fetching search results:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchResults();
  }, [searchQuery]);

  function handleAddTrack(track: any) {
    fetch(`/api/v1/groups/${groupId}/playlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(track),
    })
  }

  function handleDeleteTrack(trackId: string) {
    fetch(`/api/v1/groups/${groupId}/playlist/${trackId}`, {
      method: "DELETE",
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-h-[calc(100dvh-97px)] overflow-y-auto">
      <div className="space-y-4">
        <PlaylistHeader groupId={groupId} />
        {
          connected && playlistItems && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-400 bg-neutral-800/50 px-3 py-1.5 rounded-full">
                {playlistItems.length} {playlistItems.length === 1 ? 'Track' : 'Tracks'}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" title="Connected" />
            </div>
          )
        }
        <div className="flex flex-wrap gap-3">
          {linkedPlaylist ? (
            <ButtonGroup>
              <Button
                className="text-neutral-200 hover:bg-green-600/10 hover:text-green-400 transition-colors"
                variant="outline"
                onClick={handleSpotifySync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <SpotifyIcon />
                )}
                Sync with Spotify
              </Button>
              <Button
                variant="secondary"
                size="icon"
                asChild
                className="hover:bg-green-600/10 hover:text-green-400"
              >
                <Link
                  href={`https://open.spotify.com/playlist/${linkedPlaylist.externalPlaylistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </ButtonGroup>
          ) : (
            <Button
              className="text-neutral-200 hover:bg-green-600/10 hover:text-green-400 transition-colors"
              variant="outline"
              onClick={handleSpotifySync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <SpotifyIcon />
              )}
              Add to Spotify
            </Button>
          )}
          {syncError && (
            <span className="text-sm text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full self-center">{syncError}</span>
          )}
          <ButtonGroup className="grow">
            <Input
              placeholder="Search the playlist..."
              className="bg-neutral-900/50 border-neutral-800"
              value={playlistFilter}
              onChange={(e) => setPlaylistFilter(e.target.value)}
            />
            <Button size="icon" variant="outline" className="hover:bg-neutral-800"><Search /></Button>
          </ButtonGroup>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-md"><Plus /> Add Songs</Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800">
              <DialogHeader>
                <DialogTitle className="text-xl">Add Songs to Playlist</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Search and add songs to the group playlist.
                </DialogDescription>
              </DialogHeader>
              <div>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for songs..."
                  className="bg-neutral-800/50 border-neutral-700 focus:border-purple-500/50"
                />
                <div className="mt-4 max-h-96 overflow-y-auto space-y-1">
                  {searchResults.map((track) => (
                    <div key={track.spotifyUri} className="flex flex-row items-center gap-3 p-2.5 hover:bg-neutral-800/70 transition-colors rounded-lg group">
                      <img src={track.coverUrl} alt={track.title} className="w-12 h-12 rounded-lg shadow-md object-cover" />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-neutral-200 truncate group-hover:text-purple-300 transition-colors">{track.title}</p>
                        <p className="text-xs text-neutral-500 truncate">{track.artist} • {track.album}</p>
                      </div>
                      {
                        playlistItems.some((item) => item.spotifyUri === track.spotifyUri) ? (
                          <Button disabled variant="ghost" className="text-neutral-500">Added</Button>
                        ) : (
                          <Button className="bg-purple-600 hover:bg-purple-500" size="icon" onClick={() => handleAddTrack(track)}><Plus /></Button>
                        )
                      }
                    </div>
                  ))}
                  {searchQuery.length > 0 && searchResults.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <Music className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No songs found</p>
                    </div>
                  )}
                  {searchQuery.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Start typing to search for songs</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>

      </div>

      <div className="rounded-xl border border-neutral-800/50 overflow-hidden bg-neutral-900/30">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-neutral-800/50 hover:bg-transparent bg-neutral-800/30">
              <TableHead className="w-12 text-neutral-400 font-medium">#</TableHead>
              <TableHead className="text-neutral-400 font-medium">Title</TableHead>
              <TableHead className="text-neutral-400 font-medium">Artist</TableHead>
              <TableHead className="w-28 text-neutral-400 font-medium">Duration</TableHead>
              <TableHead className="w-24 text-neutral-400 font-medium" />
              <TableHead className="w-12 text-neutral-400 font-medium" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y-0!">
            {filteredPlaylistItems.map((item, index) => (
              <TableRow key={item.id} className="border-neutral-800/30 hover:bg-neutral-800/40 transition-colors group">
                <TableCell className="text-center text-neutral-500 group-hover:text-neutral-400">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={item.coverUrl} alt={`${item.title} thumbnail`} className="w-12 h-12 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow" />
                    </div>
                    <span className="font-medium text-neutral-200 truncate group-hover:text-white transition-colors">{item.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-400">{item.artist}</TableCell>
                <TableCell className="text-neutral-500 font-mono text-sm">{Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, '0')}</TableCell>
                <TableCell>
                  <ButtonGroup className="float-right opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.spotifyUri && (
                      <Button className="bg-[#1ED760] hover:bg-[#1ED760]/80 shadow-sm" size="icon" asChild>
                        <Link href={`https://open.spotify.com/track/${item.spotifyUri.split(':').pop()}`} target="_blank" rel="noopener noreferrer">
                          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Spotify</title><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        </Link>
                      </Button>
                    )}
                    {item.youtubeId && (
                      <Button className="bg-[#FF0000] hover:bg-[#FF0000]/80 shadow-sm" size="icon" asChild>
                        <Link href={`https://www.youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noopener noreferrer">
                          <YoutubeIcon />
                        </Link>
                      </Button>
                    )}
                  </ButtonGroup>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-700">
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-neutral-900 border-neutral-800">
                      <DropdownMenuItem variant="destructive" onClick={() => handleDeleteTrack(item.id)}>
                        <Trash /> Remove Track
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredPlaylistItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Music className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
                  {playlistFilter ? (
                    <>
                      <p className="text-neutral-500 font-medium">No tracks match your search</p>
                      <p className="text-neutral-600 text-sm mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="text-neutral-500 font-medium">No tracks in this playlist yet</p>
                      <p className="text-neutral-600 text-sm mt-1">Click "Add Songs" to get started</p>
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}