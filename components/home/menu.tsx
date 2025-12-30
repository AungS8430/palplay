import SignInButton from "@/components/home/signIn";
import Link from "next/link"
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <div className="py-3 px-4 drop-shadow-2xl border-b top-0 fixed w-full bg-neutral-950 z-50">
      <div className="flex flex-row items-center justify-between mx-auto max-w-7xl">
        <Link href="/">
          <h1 className="text-2xl font-bold text-neutral-50">PalPlay</h1>
        </Link>
        <div>
          <SignInButton />
        </div>
      </div>
    </div>
  )
}