import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "plain" | "mint" | "seafoam" | "canvas"
type Divider = "none" | "wave" | "soft"

type SectionProps = React.PropsWithChildren<{
  className?: string
  id?: string
  pad?: "sm" | "md" | "lg"
  tone?: Tone
  topDivider?: Divider
  bottomDivider?: Divider
}>

function resolvePad(pad?: "sm" | "md" | "lg") {
  switch (pad) {
    case "sm":
      return "40px"
    case "lg":
      return "98px"
    case "md":
    default:
      return "72px"
  }
}

function toneClasses(tone: Tone | undefined) {
  switch (tone) {
    case "mint":
      return "bg-white bg-[radial-gradient(60%_40%_at_80%_30%,theme(colors.emerald.50/.8),transparent),radial-gradient(40%_40%_at_20%_70%,theme(colors.teal.50/.5),transparent)]"
    case "seafoam":
      return "bg-white bg-[radial-gradient(60%_40%_at_80%_30%,theme(colors.emerald.50/.8),transparent),radial-gradient(40%_40%_at_20%_70%,theme(colors.teal.50/.5),transparent)]"
    case "canvas":
      return "bg-white bg-gradient-to-b from-emerald-50/30 to-teal-50/20"
    case "plain":
    default:
      return "bg-white"
  }
}

export function Section({ className, id, pad = "md", tone = "plain", topDivider = "none", bottomDivider = "none", children }: SectionProps) {
  const padVar = resolvePad(pad)
  const bgTone = toneClasses(tone)
  return (
    <section id={id} className={cn("relative overflow-clip", className)} style={{} as React.CSSProperties}>
      {/* background wash */}
      <div aria-hidden className={cn("absolute inset-0 -z-10", bgTone)} />
      {tone === "seafoam" && (
        <div aria-hidden className="absolute inset-0 -z-10 noise" style={{ maskImage: "radial-gradient(120%_120% at 50% 50%, rgba(0,0,0,0.85), transparent)" as any }} />
      )}

      {/* content container */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6" style={{ ["--pad" as any]: padVar } as React.CSSProperties}>
        <div className="py-[var(--pad)]">
          {children}
        </div>
      </div>

      {/* top mask */}
      {topDivider !== "none" && (
        <div aria-hidden className={cn("pointer-events-none absolute top-0 left-0 right-0 h-10 md:h-12", topDivider === "wave" ? "mask-wave rotate-180 opacity-90" : "mask-soft-top")} />
      )}
      {/* bottom mask */}
      {bottomDivider !== "none" && (
        <div aria-hidden className={cn("pointer-events-none absolute bottom-0 left-0 right-0 h-10 md:h-12", bottomDivider === "wave" ? "mask-wave opacity-90" : "mask-soft-bottom")} />
      )}
    </section>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ title, description, className = "" }: SectionHeaderProps) {
  return (
    <div className={`text-center mb-6 ${className}`}>
      <h2 className="text-3xl md:text-2xl font-bold text-gray-900 mb-4 tracking-tight text-balance">
        {title}
      </h2>
      {description && (
        <p className="content text-lg text-muted-foreground leading-relaxed mx-auto mt-2">
          {description}
        </p>
      )}
    </div>
  )
}

export default Section
