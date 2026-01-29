"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DecorProps = {
  className?: string
}

export function Orb({ className }: DecorProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl opacity-40",
        "bg-gradient-to-br from-emerald-400/40 to-teal-400/30",
        className
      )}
    />
  )
}

export function DotGrid({ className }: DecorProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background:radial-gradient(theme(colors.emerald.300)_1px,transparent_1.5px)] [background-size:16px_16px] opacity-15",
        className
      )}
    />
  )
}

export function Sparkles({ className }: DecorProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("w-5 h-5 fill-current text-emerald-400/60", className)}
    >
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/>
      <path d="M20 2v4"/>
      <path d="M22 4h-4"/>
      <circle cx="4" cy="20" r="2"/>
    </svg>
  )
}

export function WaveDivider({ position = "bottom" }: { position?: "top" | "bottom" }) {
  const isTop = position === "top"
  return (
    <div aria-hidden className={cn("w-full overflow-hidden", isTop ? "-mt-px" : "")}> 
      <svg
        className={cn("block w-full h-24 text-emerald-50", isTop ? "rotate-180" : "")}
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,58.7C672,43,768,21,864,32C960,43,1056,85,1152,96C1248,107,1344,85,1392,74.7L1440,64V90H0Z"/>
      </svg>
    </div>
  )
}


