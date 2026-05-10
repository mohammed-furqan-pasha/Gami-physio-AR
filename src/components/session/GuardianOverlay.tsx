// ============================================================
// GamiPhysio AR — GuardianOverlay
// Full overlay for Guardian Protocol (Severe severity).
// Requires 2 people detected in frame before session can start.
// ============================================================
'use client'

import { Button } from '@/components/ui/Button'

interface GuardianOverlayProps {
  personCount: number
  onProceed: () => void
  onCancel: () => void
  isActive: boolean          // true = during session (compact mode)
}

export function GuardianOverlay({
  personCount,
  onProceed,
  onCancel,
  isActive,
}: GuardianOverlayProps) {
  const guardianDetected = personCount >= 2

  // ── Compact in-session indicator ──────────────────────────
  if (isActive) {
    return (
      <div
        className={`
          fixed top-20 left-1/2 -translate-x-1/2 z-50
          px-4 py-2 rounded-full border flex items-center gap-2
          transition-all duration-300 font-mono text-sm
          ${guardianDetected
            ? 'border-neon-green/40 bg-carbon-950/80 text-neon-green'
            : 'border-warm-coral/60 bg-warm-coral/10 text-warm-coral guardian-pulse'
          }
        `}
      >
        <span className={`w-2 h-2 rounded-full ${guardianDetected ? 'bg-neon-green' : 'bg-warm-coral animate-pulse'}`} />
        {guardianDetected ? 'Guardian Present ✓' : 'Guardian Lost — Pause!'}
      </div>
    )
  }

  // ── Pre-session gate overlay ───────────────────────────────
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-carbon-950/90 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 glass-card rounded-xl2 p-8 text-center space-y-6 border-warm-coral/30 guardian-pulse">

        {/* Icon */}
        <div className="text-6xl">🛡️</div>

        {/* Title */}
        <div>
          <h2 className="font-display text-3xl font-black text-warm-coral mb-2 uppercase">
            Guardian Protocol
          </h2>
          <p className="text-warm-sand text-sm leading-relaxed">
            This exercise is classified as <strong className="text-warm-coral">Severe</strong>.
            A guardian must be present and visible in the camera before the session can begin.
          </p>
        </div>

        {/* Detection status */}
        <div className={`
          rounded-xl p-4 border transition-all duration-500
          ${guardianDetected
            ? 'border-neon-green/40 bg-neon-green/5'
            : 'border-carbon-600 bg-carbon-800'
          }
        `}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-carbon-500 uppercase tracking-wider">
              Camera Detection
            </span>
            <span className={`text-xs font-mono ${guardianDetected ? 'text-neon-green' : 'text-warm-coral'}`}>
              {personCount}/2 people
            </span>
          </div>

          {/* Person slots */}
          <div className="flex gap-3 justify-center">
            <PersonSlot
              label="Patient"
              detected={personCount >= 1}
              icon="🧑‍🦽"
            />
            <PersonSlot
              label="Guardian"
              detected={personCount >= 2}
              icon="👤"
            />
          </div>

          {!guardianDetected && (
            <p className="text-xs text-warm-sand mt-3">
              Ask your guardian to stand beside you and face the camera.
            </p>
          )}
        </div>

        {/* Instructions */}
        <ul className="text-left space-y-2 text-sm text-warm-sand">
          {[
            'Both people must be visible in the camera frame',
            'Guardian should stand to the side, not behind',
            'Guardian can say "STOP" at any time to halt the session',
            'Larger buttons are enabled during Guardian mode',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-neon-green flex-shrink-0 mt-0.5">›</span>
              {tip}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            size="xl"
            variant="guardian"
            onClick={onProceed}
            disabled={!guardianDetected}
            fullWidth
            className={guardianDetected ? 'bg-neon-green text-carbon-950 border-neon-green' : ''}
          >
            {guardianDetected ? '✓ Begin Session' : 'Waiting for Guardian…'}
          </Button>
          <Button size="md" variant="ghost" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function PersonSlot({
  label,
  detected,
  icon,
}: {
  label: string
  detected: boolean
  icon: string
}) {
  return (
    <div className={`
      flex-1 rounded-lg p-3 border transition-all duration-300
      ${detected
        ? 'border-neon-green/50 bg-neon-green/10'
        : 'border-carbon-600 bg-carbon-800/50'
      }
    `}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs font-mono text-warm-sand">{label}</p>
      <p className={`text-xs font-bold mt-0.5 ${detected ? 'text-neon-green' : 'text-carbon-500'}`}>
        {detected ? '✓ Detected' : 'Not found'}
      </p>
    </div>
  )
}
