import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import type { Metadata, Viewport } from "next"

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-jakarta",
})

export const metadata: Metadata = {
  title: "PalPlay",
  description: "A music-based social platform :)",
  applicationName: "PalPlay",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PalPlay",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jakartaSans.variable}>
      <body className={`dark ${jakartaSans.className}`}>
        {children}
      </body>
    </html>
  )
}