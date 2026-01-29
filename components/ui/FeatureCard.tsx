"use client"
import * as React from "react"
import { ChevronRight } from "lucide-react"

export function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      tabIndex={0}
      role="link"
      data-hover
      className="group rounded-2xl ring-1 ring-black/5 bg-white/80 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-150 ease-swift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        {icon}
      </div>
      <div className="mt-3 text-base font-semibold text-slate-900 flex items-center gap-1">
        {title}
        <ChevronRight
          className="size-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition duration-150 ease-swift"
          aria-hidden
        />
      </div>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  )
}

export default FeatureCard

