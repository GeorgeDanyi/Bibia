"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "emerald" | "teal" | "slate"

const toneClasses: Record<Tone, { base: string; ring: string; text: string }> = {
  emerald: { base: "bg-emerald-50", ring: "ring-emerald-100", text: "text-emerald-800" },
  teal: { base: "bg-teal-50", ring: "ring-teal-100", text: "text-teal-800" },
  slate: { base: "bg-slate-100", ring: "ring-slate-200", text: "text-slate-800" },
}

export function BadgePill({ children, className, icon, tone = "emerald" }: { children: React.ReactNode; className?: string; icon?: React.ReactNode; tone?: Tone }) {
  const t = toneClasses[tone] || toneClasses.emerald
  return (
    <span data-hover className={cn("inline-flex items-center gap-1 rounded-full text-xs px-2 py-1 ring-1", t.base, t.text, t.ring, className)}>
      {icon && <span aria-hidden className="inline-flex items-center">{icon}</span>}
      {children}
    </span>
  )
}

export default BadgePill






