"use client";

import { use, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Clock, Users, Headphones, Trophy, Disc, User, Album } from "lucide-react";
import SpotifyIcon from "@/components/icons/spotify";

interface StatsData {
  totalMembers: number;
  membersWithSpotify: number;
  totalListeningSec: number;
  totalTracksAnalyzed: number;
  topArtists: Array<{
    name: string;
    count: number;
    imageUrl: string | null;
    listenerCount: number;
  }>;
  topAlbums: Array<{
    name: string;
    artist: string;
    count: number;
    coverUrl: string | null;
    listenerCount: number;
  }>;
  topSongs: Array<{
    id: string;
    name: string;
    artist: string;
    album: string;
    coverUrl: string | null;
    durationMs: number;
    count: number;
    listenerCount: number;
  }>;
  leaderboard: Array<{
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    role: string;
    joinedAt: string;
    totalListeningMs: number;
    topTracksCount: number;
    hasSpotifyConnected: boolean;
  }>;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDurationMs(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return formatDuration(seconds);
}

function formatDurationFull(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="bg-sidebar border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-neutral-100">{value}</div>
        {description && (
          <p className="text-xs text-neutral-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-neutral-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 bg-neutral-800" />
        <Skeleton className="h-96 bg-neutral-800" />
      </div>
    </div>
  );
}

export default function GroupStatsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/v1/groups/${groupId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch stats");
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
        setError("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [groupId]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-sidebar border-red-800">
          <CardContent className="pt-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 max-h-[calc(100dvh-97px)] overflow-y-auto">
      {/* Spotify Connection Notice */}
      {stats.membersWithSpotify < stats.totalMembers && (
        <Card className="bg-sidebar border-green-800/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <SpotifyIcon className="h-5 w-5 text-green-500" />
            <p className="text-neutral-300 text-sm">
              <span className="text-green-400 font-medium">{stats.membersWithSpotify}</span> of{" "}
              <span className="font-medium">{stats.totalMembers}</span> members have Spotify
              connected. Stats are based on connected members' listening history.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Listening Time"
          value={formatDuration(stats.totalListeningSec)}
          description="Estimated group listening time"
          icon={Clock}
        />
        <StatCard
          title="Tracks Analyzed"
          value={stats.totalTracksAnalyzed}
          description="From top tracks & recent plays"
          icon={Music}
        />
        <StatCard
          title="Members"
          value={stats.totalMembers}
          description={`${stats.membersWithSpotify} with Spotify`}
          icon={Users}
        />
        <StatCard
          title="Top Artists"
          value={stats.topArtists.length}
          description="Unique artists listened to"
          icon={Headphones}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card className="bg-sidebar border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Listening Leaderboard
            </CardTitle>
            <CardDescription>
              Top listeners based on Spotify data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-transparent">
                  <TableHead className="w-12 text-neutral-400">#</TableHead>
                  <TableHead className="text-neutral-400">Member</TableHead>
                  <TableHead className="text-right text-neutral-400">Listening Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.leaderboard.map((member, index) => (
                  <TableRow key={member.user.id} className="border-neutral-800">
                    <TableCell className="font-medium text-neutral-400">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {member.user.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name || "User"}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-neutral-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-neutral-200 font-medium">
                            {member.user.name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-1">
                            {member.role === "owner" && (
                              <span className="text-xs text-neutral-500">Owner</span>
                            )}
                            {!member.hasSpotifyConnected && (
                              <span className="text-xs text-neutral-600">
                                (No Spotify)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-neutral-300">
                        {formatDurationMs(member.totalListeningMs)}
                      </span>
                      {member.topTracksCount > 0 && (
                        <p className="text-xs text-neutral-500">
                          {member.topTracksCount} top tracks
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.leaderboard.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-neutral-500 py-8">
                      No listening data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Artists */}
        <Card className="bg-sidebar border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Disc className="h-5 w-5 text-purple-500" />
              Top Artists
            </CardTitle>
            <CardDescription>
              Most listened artists by the group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topArtists.map((artist, index) => (
                <div
                  key={artist.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-neutral-500 font-medium w-6 text-center">
                    {index + 1}
                  </span>
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-neutral-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate">
                      {artist.name}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {artist.listenerCount} {artist.listenerCount === 1 ? "listener" : "listeners"}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topArtists.length === 0 && (
                <p className="text-center text-neutral-500 py-8">
                  No artist data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Albums */}
        <Card className="bg-sidebar border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Album className="h-5 w-5 text-blue-500" />
              Top Albums
            </CardTitle>
            <CardDescription>
              Most listened albums by the group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topAlbums.map((album, index) => (
                <div
                  key={`${album.name}-${album.artist}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-neutral-500 font-medium w-6 text-center">
                    {index + 1}
                  </span>
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-neutral-700 flex items-center justify-center">
                      <Album className="h-6 w-6 text-neutral-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate">
                      {album.name}
                    </p>
                    <p className="text-neutral-500 text-sm truncate">
                      {album.artist}
                    </p>
                  </div>
                  <span className="text-neutral-500 text-xs">
                    {album.listenerCount} {album.listenerCount === 1 ? "listener" : "listeners"}
                  </span>
                </div>
              ))}
              {stats.topAlbums.length === 0 && (
                <p className="text-center text-neutral-500 py-8">
                  No album data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Songs */}
        <Card className="bg-sidebar border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-green-500" />
              Top Songs
            </CardTitle>
            <CardDescription>
              Most listened songs by the group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-neutral-500 font-medium w-6 text-center">
                    {index + 1}
                  </span>
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={song.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-neutral-700 flex items-center justify-center">
                      <Music className="h-6 w-6 text-neutral-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate">
                      {song.name}
                    </p>
                    <p className="text-neutral-500 text-sm truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-400 text-sm">
                      {formatDurationFull(Math.round(song.durationMs / 1000))}
                    </p>
                    <p className="text-neutral-600 text-xs">
                      {song.listenerCount} {song.listenerCount === 1 ? "listener" : "listeners"}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topSongs.length === 0 && (
                <p className="text-center text-neutral-500 py-8">
                  No song data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

