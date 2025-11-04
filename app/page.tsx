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
        <div className="max-w-6xl mx-auto pt-[61px]">
          <div className="bg-[url('@/public/banner.png')] bg-cover bg-center h-[400px] flex items-center justify-center rounded-lg mt-6 mx-4">
            <div className="w-full h-full backdrop-brightness-75 flex flex-col items-center justify-center rounded-lg">
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-100 p-4 rounded-lg">
                Social Media, for Music Lovers
              </h1>
              <p className="text-2xl text-neutral-200 font-bold ">Join PalPlay to share a playlist, chat with songs, and more!</p>
              <SignInButton className="font-black text-base mt-10" size="lg" />
            </div>
          </div>
          <div className="flex flex-col mt-10 mx-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              What You Can Do
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <Card className="shadow-box-s">
                <CardHeader>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                  </svg>
                  <CardTitle className="font-semibold text-lg">Share music</CardTitle>
                  <CardDescription className="-mt-2">
                    Share songs and discuss with your friends by attaching songs with your message or posts.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-box-s">
                <CardHeader>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <CardTitle className="font-semibold text-lg">Collaborative Playlist</CardTitle>
                  <CardDescription className="-mt-2">
                    Create and share collaborative playlists with your group.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-box-s">
                <CardHeader>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                  </svg>
                  <CardTitle className="font-semibold text-lg">Group Statistics</CardTitle>
                  <CardDescription className="-mt-2">
                    See what your group listens to the most with detailed statistics.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
          <p className="text-center mt-10">Made with ❤️ by AungS8430</p>
        </div>
      </div>
    )
  }
}