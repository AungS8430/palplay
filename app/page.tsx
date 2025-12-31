import { getServerSession } from "next-auth";
import SignInButton from "@/components/home/signIn";
import Navbar from "@/components/home/menu";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Music, Users, FileChartPie, Sparkles } from "lucide-react"
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Root() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/app")
  } else {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900">
        <Navbar />
        <div className="max-w-6xl mx-auto pt-[61px] pb-16 px-4">
          {/* Demo Notice Section */}
          <div className="mt-4">
            <Card className="bg-amber-500/10 border-amber-500/30">
              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-xl md:text-2xl font-bold text-amber-400">
                  🎵 Demo Account Required
                </CardTitle>
                <CardDescription className="text-neutral-300 text-base leading-relaxed max-w-2xl mx-auto">
                  This demo requires you to sign in with a specific Spotify account. Please use the following credentials:
                </CardDescription>
                <div className="bg-neutral-900/70 rounded-lg p-4 max-w-md mx-auto space-y-2">
                  <p className="text-neutral-200">
                    <span className="text-neutral-400">Email:</span>{" "}
                    <code className="bg-neutral-800 px-2 py-1 rounded text-amber-300">catabe6052@dubokutv.com</code>
                  </p>
                  <p className="text-neutral-200">
                    <span className="text-neutral-400">Password:</span>{" "}
                    <code className="bg-neutral-800 px-2 py-1 rounded text-amber-300">test123456</code>
                  </p>
                </div>
              </CardHeader>
            </Card>
          </div>
          {/* Hero Section */}
          <div className="relative bg-[url('@/public/banner.png')] bg-cover bg-center h-[550px] md:h-[600px] flex items-center justify-center rounded-2xl mt-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-8 px-6 text-center">
              <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">A new way to share music</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 max-w-4xl">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-neutral-100 tracking-tight leading-tight">
                  Social Media, for{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    Music Lovers
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-neutral-300 max-w-2xl">
                  Join PalPlay to share a playlist, chat with songs, and discover what your friends are listening to!
                </p>
              </div>
              <SignInButton className="font-bold text-base px-8 py-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/25" size="lg" />
            </div>
          </div>

          {/* Features Section */}
          <div className="flex flex-col mt-16 md:mt-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-100 tracking-tight">
                What You Can Do
              </h2>
              <p className="text-neutral-400 mt-3 text-lg">
                Everything you need to share your music journey
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-neutral-900/50 border-neutral-800/50 hover:border-purple-500/30 hover:bg-neutral-800/50 transition-all duration-300 group">
                <CardHeader className="space-y-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl w-fit group-hover:bg-purple-500/20 transition-colors">
                    <Music className="size-7 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="font-semibold text-xl mb-2">Share Music</CardTitle>
                    <CardDescription className="text-neutral-400 text-base leading-relaxed">
                      Share songs and discuss with your friends by attaching songs with your message or posts.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card className="bg-neutral-900/50 border-neutral-800/50 hover:border-blue-500/30 hover:bg-neutral-800/50 transition-all duration-300 group">
                <CardHeader className="space-y-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors">
                    <Users className="size-7 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="font-semibold text-xl mb-2">Collaborative Playlist</CardTitle>
                    <CardDescription className="text-neutral-400 text-base leading-relaxed">
                      Create and share collaborative playlists with your group in real-time.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
              <Card className="bg-neutral-900/50 border-neutral-800/50 hover:border-green-500/30 hover:bg-neutral-800/50 transition-all duration-300 group">
                <CardHeader className="space-y-4">
                  <div className="p-3 bg-green-500/10 rounded-xl w-fit group-hover:bg-green-500/20 transition-colors">
                    <FileChartPie className="size-7 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="font-semibold text-xl mb-2">Group Statistics</CardTitle>
                    <CardDescription className="text-neutral-400 text-base leading-relaxed">
                      See what your group listens to the most with detailed statistics and insights.
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pt-8 border-t border-neutral-800/50">
            <p className="text-neutral-500">Made with ❤️ by AungS8430</p>
          </div>
        </div>
      </div>
    )
  }
}