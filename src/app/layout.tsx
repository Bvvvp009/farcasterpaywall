import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

// Get the base URL from environment variable or use ngrok URL for development
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rested-mastodon-truly.ngrok-free.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Farcaster Paywall',
  description: 'Share and monetize your content on Farcaster',
  openGraph: {
    title: 'Farcaster Paywall',
    description: 'Share and monetize your content on Farcaster',
    images: [`${baseUrl}/og-image.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Farcaster Paywall',
    description: 'Share and monetize your content on Farcaster',
    images: [`${baseUrl}/og-image.png`],
  },
  other: {
    'fc:frame': JSON.stringify({
      version: "next",
      imageUrl: `${baseUrl}/og-image.png`,
      button: {
        title: "🚀 Create Content",
        action: {
          type: "launch_frame",
          name: "Farcaster Paywall",
          url: `${baseUrl}`,
          splashImageUrl: `${baseUrl}/splash.png`,
          splashBackgroundColor: "#fdf2f8"
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 