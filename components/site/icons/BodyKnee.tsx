export default function BodyKnee() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-auto max-w-[160px] mx-auto text-emerald-600" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Leg silhouette */}
        <path d="M80 20v30" opacity="0.3" />
        <path d="M80 50v30" opacity="0.3" />
        <path d="M80 80v20" opacity="0.3" />
        {/* Knee joint */}
        <circle cx="80" cy="50" r="8" fill="currentColor" className="text-emerald-500/30 anim-float" />
        <circle cx="80" cy="50" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  )
}


