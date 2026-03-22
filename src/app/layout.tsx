import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VV Episode Machine — Vrolijke Vrekken',
  description: 'Van nieuws tot podcast + social content in één klik',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <script
          type="module"
          src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
        />
        <link rel="icon" href="/logo.webp" type="image/webp" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
