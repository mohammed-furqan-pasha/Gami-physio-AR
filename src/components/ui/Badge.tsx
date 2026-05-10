// ============================================================
// GamiPhysio AR — UI: SeverityBadge (Server Component)
// ============================================================
import clsx from 'clsx'
import type { SeverityLevel } from '@/types'
import { SEVERITY_CONFIG } from '@/lib/constants'

interface BadgeProps {
  severity: SeverityLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SeverityBadge({ severity, size = 'md', className }: BadgeProps) {
  const cfg = SEVERITY_CONFIG[severity]
  const sizeClasses = {
    sm:  'text-xs px-2 py-0.5',
    md:  'text-sm px-3 py-1',
    lg:  'text-base px-4 py-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-display font-bold uppercase tracking-wider',
        cfg.tailwind,
        sizeClasses[size],
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  )
}

// Re-export ScoreRing from its own dedicated client component file
export { ScoreRing } from './ScoreRing'
