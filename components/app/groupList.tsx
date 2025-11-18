"use client";

import { usePathname } from 'next/navigation'
import { SessionProvider } from "next-auth/react";
import { useRealtimeGroupList } from "@/lib/realtime";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Group from "@/components/app/group";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function GroupList() {
  return (
    <SessionProvider>
      <GroupListContent />
    </SessionProvider>
  )
}

function GroupListContent() {
  const { groups, connected } = useRealtimeGroupList();
  const pathname = usePathname();
  return (
    <>
      {
        connected ? (
          groups && groups.length > 0 ? (
            groups.map((group) => (
              <Group groupId={group.groupId} key={group.groupId} role={group.role} isActive={pathname.includes(group.groupId)} />
            ))
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No groups</EmptyTitle>
                <EmptyDescription>You are not a member of any groups yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        ) : (
          <div className="w-full h-full flex justify-center items-center py-4">
            <Spinner className="w-8 h-8" />
          </div>
        )
      }
    </>
  );
}
