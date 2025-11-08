"use client";

import { useRealtimeGroupInfo } from "@/lib/realtime";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Trash, LogOut, EllipsisVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Group({ groupId, role }: { groupId: string, role: string }) {
  const { groupInfo, connected } = useRealtimeGroupInfo(groupId);

  return (
    (
      connected ? (
        <div className="flex flex-row items-center gap-1">
          <SidebarMenuButton size="lg">
            <Avatar>
              <AvatarImage src={undefined} alt={groupId} />
              <AvatarFallback>{groupInfo?.name?.split(/[^A-Za-z]/)[0][0]}{(groupInfo?.name?.split(/[^A-Za-z]/)?.length && groupInfo?.name?.split(/[^A-Za-z]/)?.length > 1) && groupInfo?.name?.split(/[^A-Za-z]/)[1][0]}</AvatarFallback>
            </Avatar>
            <p className="truncate font-medium text-neutral-300">{groupInfo?.name ?? "User"}</p>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{groupInfo?.name ?? "Group"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  {
                    role === "owner" ? (
                      <>
                        <Trash />
                        Delete Group
                      </>
                    ) : (
                      <>
                        <LogOut />
                        Leave Group
                      </>
                    )
                  }
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-1">
          <SidebarMenuButton size="lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </SidebarMenuButton>
          <Skeleton className="h-8 w-8 square rounded" />
        </div>
      )
    )
  )
}