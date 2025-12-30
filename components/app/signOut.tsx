"use client";

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { clearSupabaseClientCache } from "@/lib/supabase";

export default function SignOutButton() {
  const handleSignOut = async () => {
    clearSupabaseClientCache();
    await signOut();
  };

  return (
    <DropdownMenuItem
      className="hover:cursor-pointer"
      onClick={handleSignOut}
    >
      <LogOut />
      Sign Out
    </DropdownMenuItem>
  );
}