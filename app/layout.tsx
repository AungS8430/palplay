import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
})

export const metadata = {
  title: "PalPlay",
  description: "A music-based social platform :)",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`dark ${jakartaSans.className}`}>
        {children}
      </body>
    </html>
  )
}