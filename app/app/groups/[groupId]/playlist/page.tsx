"use client";

import { use } from "react";
import { useRealtimeGroupPlaylist } from "@/lib/realtime";
import PlaylistHeader from "@/components/app/playlist/header";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SpotifyIcon from "@/components/icons/spotify";
import YoutubeIcon from "@/components/icons/youtube";
import { EllipsisVertical, Search, Plus } from 'lucide-react';

export default function GroupPlaylistPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);

  const { playlistItems, connected } = useRealtimeGroupPlaylist(groupId);

  return (
    <div className="p-4 space-y-4">
      <div>
        <PlaylistHeader groupId={groupId} />
        {
          connected && playlistItems && (
            <div className="text-sm font-semibold text-neutral-400 mt-1">
              <p>{playlistItems.length} Tracks</p>
            </div>
          )
        }
        <div className="mt-4 flex flex-row gap-2">
          <Button className="text-neutral-200" variant="outline"><SpotifyIcon />Add to Spotify</Button>
          <ButtonGroup className="grow">
            <Input placeholder="Search the playlist..." />
            <Button size="icon" variant="outline"><Search /></Button>
          </ButtonGroup>

          <Button><Plus /> Add Songs</Button>
        </div>

      </div>

      <div>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-neutral-400">#</TableHead>
              <TableHead className="text-neutral-400">Title</TableHead>
              <TableHead className="text-neutral-400">Artist</TableHead>
              <TableHead className="w-36 text-neutral-400">Duration</TableHead>
              <TableHead className="w-20 text-neutral-400" />
              <TableHead className="w-12 text-neutral-400" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y-0!">
            {playlistItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-end text-neutral-400">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <img src={item.thumbnailUrl} alt={`${item.title} thumbnail`} className="w-12 h-12 mr-4 object-cover" />
                    <span>{item.title}</span>
                  </div>
                </TableCell>
                <TableCell>{item.artist}</TableCell>
                <TableCell>{Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, '0')}</TableCell>
                <TableCell>
                  <ButtonGroup>
                    {item.spotifyUri && (
                      <Button className="bg-[#1ED760] hover:bg-[#1ED760]/80" size="icon" asChild>
                        <Link href={`https://open.spotify.com/track/${item.spotifyUri.split(':').pop()}`} target="_blank" rel="noopener noreferrer">
                          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Spotify</title><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        </Link>
                      </Button>
                    )}
                    {item.youtubeId && (
                      <Button className="bg-[#FF0000] hover:bg-[#FF0000]/80" size="icon" asChild>
                        <Link href={`https://www.youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noopener noreferrer">
                          <YoutubeIcon />
                        </Link>
                      </Button>
                    )}
                  </ButtonGroup>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="icon">
                    <EllipsisVertical />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  )
}