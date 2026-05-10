// ============================================================
// GamiPhysio AR — Navbar
// ============================================================
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV_LINKS = [
  { href: '/upload',  label: 'Upload Report' },
  { href: '/plan',    label: 'Exercise Plan' },
  { href: '/profile', label: 'Progress' },
]

export default function Navbar() {
  const pathname = usePathname()
  const isSession = pathname === '/session'

  // Hide navbar in full-screen session
  if (isSession) return null

  return (
    <header className="sticky top-0 z-50 border-b border-carbon-700 bg-carbon-950/90 backdrop-blur-hud">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-display font-black text-warm-cream group-hover:text-neon-green transition-colors">
            GAMI<span className="text-neon-green">PHYSIO</span>
          </span>
          <span className="hidden sm:block text-xs font-mono text-carbon-500 border border-carbon-600 px-1.5 py-0.5 rounded">
            AR
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 min-h-touch flex items-center',
                pathname === link.href
                  ? 'text-neon-green bg-neon-green/10'
                  : 'text-warm-sand hover:text-warm-cream hover:bg-carbon-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
