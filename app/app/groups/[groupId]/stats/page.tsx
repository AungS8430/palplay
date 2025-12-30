"use client";

import { use, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  gradient,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  gradient?: string;
}) {
  return (
    <Card className="bg-sidebar/80 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300 group overflow-hidden relative">
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${gradient || 'bg-gradient-to-br from-neutral-500 to-neutral-700'}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-neutral-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${gradient || 'bg-neutral-800'} bg-opacity-50`}>
          <Icon className="h-4 w-4 text-neutral-300" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-neutral-100 tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-neutral-500 mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl bg-neutral-800/50 h-36">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700/30 to-transparent animate-shimmer" />
            <Skeleton className="absolute top-4 left-4 h-4 w-24 bg-neutral-700/50" />
            <Skeleton className="absolute bottom-10 left-4 h-8 w-16 bg-neutral-700/50" />
            <Skeleton className="absolute bottom-4 left-4 h-3 w-32 bg-neutral-700/50" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl bg-neutral-800/50 h-[420px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700/30 to-transparent animate-shimmer" />
            <Skeleton className="absolute top-6 left-6 h-6 w-40 bg-neutral-700/50" />
            <Skeleton className="absolute top-14 left-6 h-4 w-56 bg-neutral-700/50" />
            {[...Array(5)].map((_, j) => (
              <div key={j} className="absolute left-6 right-6 flex items-center gap-3" style={{ top: `${100 + j * 60}px` }}>
                <Skeleton className="h-10 w-10 rounded-full bg-neutral-700/50" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 bg-neutral-700/50 mb-2" />
                  <Skeleton className="h-3 w-20 bg-neutral-700/50" />
                </div>
              </div>
            ))}
          </div>
        ))}
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
    <div className="p-4 md:p-6 space-y-8 max-h-[calc(100dvh-117px)] overflow-y-auto">
      {/* Spotify Connection Notice */}
      {stats.membersWithSpotify < stats.totalMembers && (
        <Card className="bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-700/30 backdrop-blur-sm">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2.5 bg-green-500/20 rounded-full">
              <SpotifyIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-neutral-300 text-sm">
              <span className="text-green-400 font-semibold">{stats.membersWithSpotify}</span> of{" "}
              <span className="font-semibold text-neutral-200">{stats.totalMembers}</span> members have Spotify
              connected. Stats are based on connected members' listening history.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Listening Time"
          value={formatDuration(stats.totalListeningSec)}
          description="Estimated group listening time"
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Tracks Analyzed"
          value={stats.totalTracksAnalyzed.toLocaleString()}
          description="From top tracks & recent plays"
          icon={Music}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          title="Members"
          value={stats.totalMembers}
          description={`${stats.membersWithSpotify} with Spotify connected`}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          title="Top Artists"
          value={stats.topArtists.length}
          description="Unique artists discovered"
          icon={Headphones}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card className="bg-sidebar/80 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Listening Leaderboard</CardTitle>
                <CardDescription className="mt-1">
                  Top listeners based on Spotify data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.leaderboard.map((member, index) => (
                <div
                  key={member.user.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-neutral-800/50 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                    index === 1 ? 'bg-gradient-to-r from-neutral-400/10 to-transparent' :
                    index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent' : ''
                  }`}
                >
                  <div className="w-8 text-center">
                    {index === 0 && <span className="text-xl">🥇</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                    {index > 2 && <span className="text-neutral-500 font-medium">{index + 1}</span>}
                  </div>
                  <div className="relative">
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || "User"}
                        className="w-10 h-10 rounded-full ring-2 ring-neutral-700/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center ring-2 ring-neutral-700/50">
                        <User className="h-5 w-5 text-neutral-400" />
                      </div>
                    )}
                    {member.hasSpotifyConnected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <SpotifyIcon className="h-2.5 w-2.5 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate">
                      {member.user.name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2">
                      {member.role === "owner" && (
                        <span className="text-xs text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">Owner</span>
                      )}
                      {!member.hasSpotifyConnected && (
                        <span className="text-xs text-neutral-600">No Spotify</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-200 font-semibold">
                      {formatDurationMs(member.totalListeningMs)}
                    </span>
                    {member.topTracksCount > 0 && (
                      <p className="text-xs text-neutral-500">
                        {member.topTracksCount} tracks
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {stats.leaderboard.length === 0 && (
                <div className="text-center text-neutral-500 py-12">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No listening data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Artists */}
        <Card className="bg-sidebar/80 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <Disc className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Top Artists</CardTitle>
                <CardDescription className="mt-1">
                  Most listened artists by the group
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topArtists.map((artist, index) => (
                <div
                  key={artist.name}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-200 group"
                >
                  <span className={`font-bold w-6 text-center ${
                    index === 0 ? 'text-purple-400' :
                    index === 1 ? 'text-purple-500/80' :
                    index === 2 ? 'text-purple-600/80' : 'text-neutral-500'
                  }`}>
                    {index + 1}
                  </span>
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-700/50 group-hover:ring-purple-500/30 transition-all"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/50 to-neutral-800 flex items-center justify-center ring-2 ring-neutral-700/50">
                      <User className="h-6 w-6 text-purple-400/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate group-hover:text-purple-300 transition-colors">
                      {artist.name}
                    </p>
                    <p className="text-neutral-500 text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {artist.listenerCount} {artist.listenerCount === 1 ? "listener" : "listeners"}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topArtists.length === 0 && (
                <div className="text-center text-neutral-500 py-12">
                  <Disc className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No artist data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Albums */}
        <Card className="bg-sidebar/80 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Album className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Top Albums</CardTitle>
                <CardDescription className="mt-1">
                  Most listened albums by the group
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topAlbums.map((album, index) => (
                <div
                  key={`${album.name}-${album.artist}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-200 group"
                >
                  <span className={`font-bold w-6 text-center ${
                    index === 0 ? 'text-blue-400' :
                    index === 1 ? 'text-blue-500/80' :
                    index === 2 ? 'text-blue-600/80' : 'text-neutral-500'
                  }`}>
                    {index + 1}
                  </span>
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:shadow-blue-500/10 transition-all"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-900/50 to-neutral-800 flex items-center justify-center">
                      <Album className="h-7 w-7 text-blue-400/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate group-hover:text-blue-300 transition-colors">
                      {album.name}
                    </p>
                    <p className="text-neutral-500 text-sm truncate">
                      {album.artist}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded-full">
                      {album.listenerCount} {album.listenerCount === 1 ? "listener" : "listeners"}
                    </span>
                  </div>
                </div>
              ))}
              {stats.topAlbums.length === 0 && (
                <div className="text-center text-neutral-500 py-12">
                  <Album className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No album data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Songs */}
        <Card className="bg-sidebar/80 backdrop-blur-sm border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <Music className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Top Songs</CardTitle>
                <CardDescription className="mt-1">
                  Most listened songs by the group
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition-all duration-200 group"
                >
                  <span className={`font-bold w-6 text-center ${
                    index === 0 ? 'text-green-400' :
                    index === 1 ? 'text-green-500/80' :
                    index === 2 ? 'text-green-600/80' : 'text-neutral-500'
                  }`}>
                    {index + 1}
                  </span>
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={song.name}
                      className="w-14 h-14 rounded-lg object-cover shadow-lg group-hover:shadow-green-500/10 transition-all"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-900/50 to-neutral-800 flex items-center justify-center">
                      <Music className="h-7 w-7 text-green-400/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 font-medium truncate group-hover:text-green-300 transition-colors">
                      {song.name}
                    </p>
                    <p className="text-neutral-500 text-sm truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-neutral-400 text-sm font-mono">
                      {formatDurationFull(Math.round(song.durationMs / 1000))}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {song.listenerCount} {song.listenerCount === 1 ? "listener" : "listeners"}
                    </p>
                  </div>
                </div>
              ))}
              {stats.topSongs.length === 0 && (
                <div className="text-center text-neutral-500 py-12">
                  <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No song data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

