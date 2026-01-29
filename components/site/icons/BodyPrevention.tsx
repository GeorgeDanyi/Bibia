export default function BodyPrevention() {
  return (
    <svg viewBox="0 0 160 120" className="w-full h-auto max-w-[160px] mx-auto text-emerald-600" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Shield outline */}
        <path d="M80 20l-20 8v20c0 20 20 35 20 35s20-15 20-35V28l-20-8z" opacity="0.3" />
        {/* Check/leaf inside */}
        <path d="M65 50l8 8 16-16" strokeWidth="2.5" />
        {/* Highlight circle */}
        <circle cx="80" cy="40" r="6" fill="currentColor" className="text-emerald-500/30 anim-float" />
      </g>
    </svg>
  )
}


