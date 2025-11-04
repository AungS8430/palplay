"use client";

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button";

export default function SignInButton({ size = "default", className }: { size?: "sm" | "default" | "lg", className?: string }) {
  return (
    <Button
      className={`bg-violet-600 hover:bg-violet-500 ${className ?? ""}`}
      size={size}
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}