import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────────
        neon: {
          green:  '#39FF14',
          lime:   '#B5F01A',
          yellow: '#FFE500',
        },
        carbon: {
          950: '#080A0C',
          900: '#0E1114',
          800: '#161B20',
          700: '#1E252D',
          600: '#2A3340',
          500: '#374250',
        },
        warm: {
          cream:  '#FFF8EE',
          amber:  '#FFB347',
          coral:  '#FF6B6B',
          sand:   '#E8D5B7',
        },
        severity: {
          mild:     '#39FF14',
          moderate: '#FFE500',
          severe:   '#FF6B6B',
        },
        score: {
          poor:     '#FF4444',
          fair:     '#FF8C00',
          good:     '#FFE500',
          great:    '#B5F01A',
          perfect:  '#39FF14',
        },
      },

      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },

      fontSize: {
        // Accessible large targets for elderly users
        'accessible-sm': ['1.0625rem', { lineHeight: '1.6' }],
        'accessible-base': ['1.125rem', { lineHeight: '1.65' }],
        'accessible-lg': ['1.25rem', { lineHeight: '1.6' }],
      },

      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
        'xl4': '2rem',
      },

      boxShadow: {
        'neon-sm':  '0 0 8px rgba(57,255,20,0.4)',
        'neon-md':  '0 0 20px rgba(57,255,20,0.5)',
        'neon-lg':  '0 0 40px rgba(57,255,20,0.6)',
        'warm-glow':'0 0 30px rgba(255,179,71,0.3)',
        'hud':      'inset 0 1px 0 rgba(255,255,255,0.08)',
      },

      animation: {
        'pulse-neon':  'pulseNeon 2s ease-in-out infinite',
        'score-pop':   'scorePop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up':    'slideUp 0.35s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'ring-fill':   'ringFill 0.6s ease-out forwards',
        'jitter-shake':'jitterShake 0.5s ease-in-out',
      },

      keyframes: {
        pulseNeon: {
          '0%,100%': { boxShadow: '0 0 10px rgba(57,255,20,0.4)' },
          '50%':     { boxShadow: '0 0 30px rgba(57,255,20,0.8)' },
        },
        scorePop: {
          '0%':   { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ringFill: {
          '0%':   { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--ring-offset)' },
        },
        jitterShake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%':     { transform: 'translateX(-6px)' },
          '75%':     { transform: 'translateX(6px)' },
        },
      },

      // Minimum touch target sizes (accessibility)
      minHeight: {
        'touch': '48px',
        'touch-lg': '64px',
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '64px',
      },

      backdropBlur: {
        'hud': '12px',
      },
    },
  },
  plugins: [],
}

export default config
