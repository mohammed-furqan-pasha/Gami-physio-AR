// ============================================================
// GamiPhysio AR — Root Layout
// ============================================================
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'GamiPhysio AR — Intelligent Rehabilitation',
  description:
    'AI-powered augmented reality rehabilitation platform with biomechanical scoring and Guardian Protocol.',
  keywords: ['physiotherapy', 'rehabilitation', 'AR', 'pose estimation', 'exercise'],
  authors: [{ name: 'GamiPhysio' }],
}


// ✅ Add this separate export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-carbon-950 text-warm-cream relative">
        <Navbar />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
