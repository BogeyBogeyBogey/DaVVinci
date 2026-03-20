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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
