import { Music, ArrowLeft } from "lucide-react";

export default async function AppPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100dvh-1px)] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="text-center max-w-md px-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
          <div className="relative p-6 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 inline-block">
            <Music className="h-16 w-16 text-purple-400" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-100 mb-3 tracking-tight">
          Welcome to PalPlay
        </h1>
        <p className="text-neutral-400 text-base mb-8 leading-relaxed">
          Select a group from the sidebar to start chatting, sharing playlists, and viewing listening stats with your friends.
        </p>
        <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm">
          <ArrowLeft className="h-4 w-4 animate-pulse" />
          <span>Choose a group to get started</span>
        </div>
      </div>
    </div>
  )
}