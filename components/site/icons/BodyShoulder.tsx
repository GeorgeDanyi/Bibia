export default function BodyShoulder() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-auto max-w-[160px] mx-auto text-emerald-600" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Upper torso line */}
        <path d="M50 50c0-8 8-15 18-15s18 7 18 15" opacity="0.3" />
        <path d="M50 50c0 8 8 15 18 15s18-7 18-15" opacity="0.3" />
        {/* Shoulder joint */}
        <circle cx="68" cy="50" r="8" fill="currentColor" className="text-emerald-500/30 anim-float" />
        <circle cx="68" cy="50" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  )
}


