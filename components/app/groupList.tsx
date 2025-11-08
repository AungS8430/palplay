"use client";

import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useRealtimeGroupList } from "@/lib/realtime";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Group from "@/components/app/group";
import { Spinner } from "@/components/ui/spinner";

export default function GroupList() {
  return (
    <SessionProvider>
      <GroupListContent />
    </SessionProvider>
  )
}

function GroupListContent() {
  const { groups, connected } = useRealtimeGroupList();
  return (
    <>
      {
        connected ? (
          groups && groups.length > 0 ? (
            groups.map((group) => (
              <Group groupId={group.groupId} key={group.groupId} role={group.role} />
            ))
          ) : (
            <p className="text-sm text-neutral-500">You are not a member of any groups yet.</p>
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
