interface SectionWaveProps {
  variant: 'top' | 'bottom'
  className?: string
}

export function SectionWave({ variant, className = '' }: SectionWaveProps) {
  const isTop = variant === 'top'
  
  return (
    <div className={`absolute ${isTop ? 'top-0' : 'bottom-0'} left-0 right-0 h-16 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={`w-full h-full ${isTop ? 'rotate-180' : ''}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="s1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(236 253 245 / 0.7)" />
            <stop offset="100%" stopColor="rgb(240 253 250 / 0.5)" />
          </linearGradient>
        </defs>
        <path
          d="M0,60 C300,20 600,100 900,60 C1050,40 1200,80 1200,60 L1200,120 L0,120 Z"
          fill="url(#s1)"
        />
      </svg>
    </div>
  )
}