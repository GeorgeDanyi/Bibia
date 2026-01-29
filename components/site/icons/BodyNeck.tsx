export default function BodyNeck() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-auto max-w-[160px] mx-auto text-emerald-600" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Head */}
        <circle cx="80" cy="30" r="12" opacity="0.3" />
        {/* Neck column */}
        <path d="M80 42v25" strokeWidth="3" />
        {/* Upper torso */}
        <path d="M80 67c-8 0-15 5-15 15" opacity="0.3" />
        <path d="M80 67c8 0 15 5 15 15" opacity="0.3" />
        {/* Highlight at base of skull */}
        <circle cx="80" cy="42" r="6" fill="currentColor" className="text-emerald-500/30 anim-float" />
      </g>
    </svg>
  )
}


