"use client";

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function SignOutButton() {
  return (
    <DropdownMenuItem
      className={`hover:cursor-pointer`}
      onClick={() => signOut()}
    >
      <LogOut />
      Sign Out
    </DropdownMenuItem>
  );
}