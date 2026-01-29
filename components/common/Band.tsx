import { ReactNode } from "react"

interface BandProps {
  children?: ReactNode
  className?: string
}

export function Band({ children, className = "" }: BandProps) {
  return (
    <div className={`w-full bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/30 ${className}`}>
      <div className="mx-auto max-w-screen-2xl px-4">
        {children}
      </div>
    </div>
  )
}
