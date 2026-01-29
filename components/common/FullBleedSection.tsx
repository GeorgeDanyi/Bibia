import { ReactNode } from "react"

interface FullBleedSectionProps {
  children: ReactNode
  id?: string
  bgClass?: string
  className?: string
}

// Simple cn helper for class concatenation
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function FullBleedSection({ 
  children, 
  id, 
  bgClass = "", 
  className = "" 
}: FullBleedSectionProps) {
  return (
    <section 
      id={id} 
      className={cn("w-full", bgClass, className)}
    >
      <div className="mx-auto max-w-screen-xl px-4 py-16 md:py-24">
        {children}
      </div>
    </section>
  )
}
