// ============================================================
// GamiPhysio AR — Home / Landing Page
// ============================================================
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="page-enter min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 py-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-sm font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          Decision Support Prototype — Not a Medical Device
        </div>

        <h1 className="font-display text-6xl md:text-8xl font-black text-warm-cream mb-4 leading-none">
          GAMI
          <span className="text-neon-glow text-neon-green">PHYSIO</span>
          <br />
          <span className="text-4xl md:text-5xl text-carbon-500 font-light tracking-widest">
            AUGMENTED REALITY
          </span>
        </h1>

        <p className="text-accessible-lg text-warm-sand max-w-xl mx-auto mt-6 leading-relaxed">
          Upload your medical report. Get a personalized AR exercise plan.
          Track your recovery with biomechanical precision.
        </p>
      </div>

      {/* ── CTA Buttons ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <Link
          href="/upload"
          className="btn-accessible px-10 py-4 rounded-xl2 bg-neon-green text-carbon-950 hover:bg-neon-lime transition-all duration-200 shadow-neon-md hover:shadow-neon-lg text-center"
        >
          Upload Report → Start
        </Link>
        <Link
          href="/profile"
          className="btn-accessible px-10 py-4 rounded-xl2 border border-carbon-600 text-warm-cream hover:border-neon-green/50 hover:text-neon-green transition-all duration-200 text-center"
        >
          View Recovery Progress
        </Link>
      </div>

      {/* ── Feature Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full">
        {features.map((f, i) => (
          <div
            key={i}
            className="glass-card rounded-xl2 p-6 hover:border-neon-green/40 transition-colors duration-200"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-display text-lg font-bold text-warm-cream mb-1">{f.title}</h3>
            <p className="text-sm text-warm-sand leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Safety Notice ────────────────────────────────────── */}
      <p className="mt-16 text-xs text-carbon-500 text-center max-w-md">
        Always consult a qualified physiotherapist before beginning any exercise program.
        This app does not replace professional medical advice.
      </p>
    </div>
  )
}

const features = [
  {
    icon: '🧠',
    title: 'AI Report Parsing',
    desc: 'Gemini 2.0 Flash reads your X-rays and medical reports to extract a personalized exercise plan.',
  },
  {
    icon: '📷',
    title: 'AR Pose Tracking',
    desc: 'MediaPipe Pose runs locally in your browser — no data leaves your device.',
  },
  {
    icon: '🎯',
    title: '1–5 Rep Scoring',
    desc: 'Each rep is graded on joint angle precision. Hit perfect form for 5 points.',
  },
  {
    icon: '🛡️',
    title: 'Guardian Protocol',
    desc: 'Severe cases require a guardian in-frame. Voice safety commands "STOP" and "HELP" always active.',
  },
]
