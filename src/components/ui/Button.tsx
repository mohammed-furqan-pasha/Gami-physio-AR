// ============================================================
// GamiPhysio AR — Button Component
// Large, accessible touch targets. Guardian-mode safe.
// ============================================================
import { forwardRef } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'guardian'
type ButtonSize    = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-neon-green text-carbon-950 hover:bg-neon-lime active:scale-[0.98] shadow-neon-sm hover:shadow-neon-md',
  secondary:
    'border border-carbon-600 text-warm-cream hover:border-neon-green/50 hover:text-neon-green bg-carbon-800 hover:bg-carbon-700',
  danger:
    'bg-warm-coral text-white hover:bg-red-500 active:scale-[0.98]',
  ghost:
    'text-warm-sand hover:text-warm-cream hover:bg-carbon-800',
  guardian:
    'bg-warm-coral text-white border-2 border-warm-coral hover:bg-red-500 guardian-pulse text-xl',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm:  'px-4 py-2 text-sm rounded-lg min-h-touch',
  md:  'px-6 py-3 text-base rounded-xl min-h-touch',
  lg:  'px-8 py-4 text-lg rounded-xl2 min-h-touch-lg',
  xl:  'px-10 py-5 text-xl rounded-xl2 min-h-touch-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'btn-accessible inline-flex items-center justify-center gap-2 font-display font-bold uppercase tracking-widest transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity={0.3} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Processing…
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
