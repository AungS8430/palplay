"use client";

import { usePathname } from "next/navigation";
import { useRealtimeGroupInfo } from "@/lib/realtime";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function GroupTabs({ groupId }: { groupId: string }) {
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);
  const pathname = usePathname();

  if (!connected || !groupInfo) {
    return null;
  }
  return (
    <div className="border-b w-full p-2 flex flex-col gap-2 bg-sidebar">
      <div className="flex justify-end">
        <h1 className="mx-auto text-center font-semibold text-neutral-200 text-lg">{groupInfo.name}</h1>
        <div>
          <Button variant="ghost" size="icon"><Settings /></Button>
        </div>
      </div>

      <div className="flex flex-row mx-auto px-2 gap-2 justify-between w-full">
        <Link href={`/app/groups/${groupId}`} className="w-full">
          <Button variant={pathname == `/app/groups/${groupId}` ? "outline" : "ghost"} className="w-full text-semibold text-neutral-300 hover:cursor-pointer">Chat</Button>
        </Link>
        <Link href={`/app/groups/${groupId}/posts`} className="w-full">
          <Button variant={pathname.includes(`/app/groups/${groupId}/posts`) ? "outline" : "ghost"} className="w-full text-neutral-300 hover:cursor-pointer">Posts</Button>
        </Link>
        <Link href={`/app/groups/${groupId}/playlist`} className="w-full">
          <Button variant={pathname.includes(`/app/groups/${groupId}/playlist`) ? "outline" : "ghost"} className="w-full text-neutral-300 hover:cursor-pointer">Playlist</Button>
        </Link>
        <Link href={`/app/groups/${groupId}/stats`} className="w-full">
          <Button variant={pathname.includes(`/app/groups/${groupId}/stats`) ? "outline" : "ghost"} className="w-full text-neutral-300 hover:cursor-pointer">Stats</Button>
        </Link>
      </div>
    </div>
  )
}