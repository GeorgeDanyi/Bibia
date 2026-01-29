export default function TherapyMiniIllustration() {
  return (
    <svg viewBox="0 0 140 100" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#A7F3D0" />
          <stop offset="1" stopColor="#99F6E4" />
        </linearGradient>
      </defs>
      {/* blob */}
      <g className="animate-bob">
        <ellipse cx="70" cy="55" rx="40" ry="28" fill="url(#g1)" opacity=".55" />
        <circle cx="70" cy="50" r="12" fill="#10B981" opacity=".9" />
      </g>
      {/* sparkles */}
      <g className="animate-spark">
        <circle cx="30" cy="28" r="3" fill="#10B981" opacity=".7" />
      </g>
      <g className="animate-spark">
        <circle cx="110" cy="22" r="3" fill="#14B8A6" opacity=".7" />
      </g>
    </svg>
  )
}


