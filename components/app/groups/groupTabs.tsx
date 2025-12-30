"use client";

import { usePathname } from "next/navigation";
import { useRealtimeGroupInfo } from "@/lib/realtime";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, MessageCircle, ListMusic, BarChart3 } from "lucide-react";

export default function GroupTabs({ groupId }: { groupId: string }) {
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);
  const pathname = usePathname();

  if (!connected || !groupInfo) {
    return null;
  }

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.includes(path);
  };

  return (
    <div className="border-b border-neutral-800/50 w-full p-3 flex flex-col gap-3 bg-sidebar/80 backdrop-blur-sm">
      <div className="flex justify-between items-center px-1">
        <div className="w-10"></div>
        <h1 className="text-center font-semibold text-neutral-100 text-lg tracking-tight">{groupInfo.name}</h1>
        <Button variant="ghost" size="icon" className="hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-row gap-1 bg-neutral-900/50 p-1 rounded-lg">
        <Link href={`/app/groups/${groupId}`} className="flex-1">
          <Button
            variant={isActive(`/app/groups/${groupId}`, true) ? "secondary" : "ghost"}
            className={`w-full text-sm font-medium transition-all ${
              isActive(`/app/groups/${groupId}`, true) 
                ? "bg-neutral-700/50 text-neutral-100 shadow-sm" 
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30"
            }`}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Chat
          </Button>
        </Link>
        <Link href={`/app/groups/${groupId}/playlist`} className="flex-1">
          <Button
            variant={isActive(`/app/groups/${groupId}/playlist`) ? "secondary" : "ghost"}
            className={`w-full text-sm font-medium transition-all ${
              isActive(`/app/groups/${groupId}/playlist`) 
                ? "bg-neutral-700/50 text-neutral-100 shadow-sm" 
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30"
            }`}
          >
            <ListMusic className="h-4 w-4 mr-1.5" />
            Playlist
          </Button>
        </Link>
        <Link href={`/app/groups/${groupId}/stats`} className="flex-1">
          <Button
            variant={isActive(`/app/groups/${groupId}/stats`) ? "secondary" : "ghost"}
            className={`w-full text-sm font-medium transition-all ${
              isActive(`/app/groups/${groupId}/stats`) 
                ? "bg-neutral-700/50 text-neutral-100 shadow-sm" 
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30"
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Stats
          </Button>
        </Link>
      </div>
    </div>
  )
}