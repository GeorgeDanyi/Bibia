"use client"

import Link from "next/link"
import { useState } from "react"

export function InsuranceContribution() {
  const [activeInsurer, setActiveInsurer] = useState<string | null>(null)

  const insurers = [
    "VZP 111",
    "OZP 207", 
    "ČPZP 205",
    "ZPMV 211",
    "RBP 213",
    "VoZP 201",
    "ZPŠ 209"
  ]

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Lightened dark green card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1f5a51]/90 backdrop-blur-sm border border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-6 md:p-8 py-7 md:py-8">
          {/* Left accent strip */}
          <div className="absolute inset-y-0 left-0 w-[6px] rounded-l-2xl bg-gradient-to-b from-emerald-400/80 to-teal-300/80" />
          
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          {/* Two column layout */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left column - Content */}
            <div className="space-y-6">
              {/* Small headline with icon */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white/90">
                  Můžeš získat příspěvek
                </h3>
              </div>

              {/* Main claim */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Pojišťovny přispívají na fyzioterapii až{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  2&nbsp;000&nbsp;Kč/rok
                </span>.
              </h2>

              {/* Subtext */}
              <p className="text-white/80 text-base md:text-lg leading-relaxed">
                Částky a podmínky se liší podle pojišťovny a programu.
              </p>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/insurance"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-5 py-2.5 text-white font-semibold shadow-[0_10px_22px_rgba(20,184,166,0.28)] hover:shadow-[0_14px_30px_rgba(20,184,166,0.36)] hover:scale-[1.02] transition focus-visible:ring-2 focus-visible:ring-emerald-300 motion-reduce:hover:scale-100"
                >
                  <span>Zjistit, jak získat</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                
                <Link
                  href="/insurance"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white/90 px-5 py-2.5 hover:bg-white/8 transition focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Ověřit pojišťovnu
                </Link>
              </div>
            </div>

            {/* Right column - Insurance companies */}
            <div className="space-y-6">
              {/* Heading */}
              <h3 className="text-xl font-semibold text-white/90">
                Podporují:
              </h3>

              {/* Insurance pills - Responsive grid */}
              <div className="flex gap-2 overflow-x-auto snap-x [&>*]:snap-start md:overflow-visible md:grid md:grid-cols-4">
                {insurers.map((insurer, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveInsurer(activeInsurer === insurer ? null : insurer)}
                    className={`select-none cursor-pointer rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                      activeInsurer === insurer
                        ? "bg-emerald-500 text-white border border-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]"
                        : "text-white/95 bg-white/15 border border-white/10 hover:bg-white/22 hover:-translate-y-[1px]"
                    }`}
                    aria-pressed={activeInsurer === insurer}
                    aria-label={`Pojišťovna ${insurer} – info o příspěvku`}
                  >
                    {insurer}
                  </button>
                ))}
              </div>

              {/* Verified insurers line */}
              <div className="flex items-center gap-2 text-white/85 text-sm">
                <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ověřené pojišťovny</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
