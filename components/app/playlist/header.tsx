"use client";

import { useRealtimeGroupInfo } from "@/lib/realtime";

export default function PlaylistHeader({ groupId }: { groupId: string }) {
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);

  return (
    <div className="w-full">
      {connected && groupInfo ? (
        <h1 className="text-4xl font-bold text-neutral-200">{groupInfo.name} Playlist</h1>
      ) : (
        <h1 className="text-2xl font-bold text-neutral-200">Loading...</h1>
      )}
    </div>
  )
}