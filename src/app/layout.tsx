import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VV Episode Creator — Vrolijke Vrekken',
  description: 'Van nieuwsartikel tot volledig uitgeschreven podcastscript',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
