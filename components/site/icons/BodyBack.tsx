export default function BodyBack() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-auto max-w-[160px] mx-auto text-emerald-600" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Torso outline */}
        <path d="M80 20c-15 0-25 10-25 30s10 35 25 35 25-10 25-35S95 20 80 20z" opacity="0.3" />
        {/* Spine */}
        <path d="M80 30v50" />
        <path d="M80 35v5" />
        <path d="M80 45v5" />
        <path d="M80 55v5" />
        <path d="M80 65v5" />
        {/* Highlight circle behind middle vertebra */}
        <circle cx="80" cy="50" r="8" fill="currentColor" className="text-emerald-500/30 anim-float" />
      </g>
    </svg>
  )
}


