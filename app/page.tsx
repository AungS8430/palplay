import { getServerSession } from "next-auth";
import SignInButton from "@/components/home/signIn";
import Navbar from "@/components/home/menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Music, Users, FileChartPie } from "lucide-react"
import Image from "next/image";

export default async function Root() {
  const session = await getServerSession();
  if (session) {
    return (
      // TODO
      <div>

      </div>
    )
  } else {
    return (
      <div>
        <Navbar />
        <div className="max-w-6xl mx-auto pt-[61px] pb-10">
          <div className="bg-[url('@/public/banner.png')] bg-cover bg-center h-[600px] flex items-center justify-center rounded-lg mt-6 mx-4">
            <div className="w-full h-full backdrop-brightness-75 flex flex-col items-center justify-center rounded-lg gap-8">
              <div className="flex flex-col items-center justify-center gap-2">
                <h1 className="text-4xl md:text-6xl font-bold text-neutral-100 rounded-lg tracking-tight">
                  Social Media, for Music Lovers
                </h1>
                <p className="text-2xl text-neutral-200 font-bold ">Join PalPlay to share a playlist, chat with songs, and more!</p>
              </div>
              <SignInButton className="font-black text-base" size="lg" />
            </div>
          </div>
          <div className="flex flex-col mt-10 mx-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-neutral-100">
              What You Can Do
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Card className="shadow-box-s">
                <CardHeader>
                  <Music className="size-8 text-neutral-200" />
                  <CardTitle className="font-semibold text-lg">Share music</CardTitle>
                  <CardDescription className="-mt-2">
                    Share songs and discuss with your friends by attaching songs with your message or posts.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-box-s">
                <CardHeader>
                  <Users className="size-8 text-neutral-200" />
                  <CardTitle className="font-semibold text-lg">Collaborative Playlist</CardTitle>
                  <CardDescription className="-mt-2">
                    Create and share collaborative playlists with your group.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-box-s">
                <CardHeader>
                  <FileChartPie className="size-8 text-neutral-200" />
                  <CardTitle className="font-semibold text-lg">Group Statistics</CardTitle>
                  <CardDescription className="-mt-2">
                    See what your group listens to the most with detailed statistics.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
          <p className="text-center text-neutral-200 mt-10">Made with ❤️ by AungS8430</p>
        </div>
      </div>
    )
  }
}