"use client"

import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"

export function Benefits() {
  const cards = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      title: "Najdeš toho pravého",
      description: "Chytré doporučení podle potíží, lokality a zkušeností."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      ),
      title: "Ušetříš čas i nervy",
      description: "Přehledné profily, jasné ceny, rychlá rezervace online."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
          <path d="M13 12h3a2 2 0 0 1 2 2v1"/>
          <path d="M8 12H5a2 2 0 0 0-2 2v1"/>
        </svg>
      ),
      title: "Důvěryhodná volba",
      description: "Ověření terapeuti a transparentní recenze."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <circle cx="12" cy="16" r="2"/>
        </svg>
      ),
      title: "Termíny bez čekání",
      description: "Volné sloty v reálném čase."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      title: "Bezpečná platba",
      description: "Platba kartou nebo na místě, šifrované spojení."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M13 8H7"/>
          <path d="M17 12H7"/>
        </svg>
      ),
      title: "Podpora na blízku",
      description: "Když něco neklapne, pomůžeme do 24 h."
    }
  ]

  return (
    <section id="proc-bibia" className="relative overflow-hidden bg-gradient-to-b from-[#e9f6f3] to-white py-16 md:py-20">
      {/* Subtle animated background elements */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#2e8b75]/8 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-32 w-32 rounded-full bg-[#3da188]/6 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c4a44] mb-4">
            Proč právě Bibia?
          </h2>
        </div>

        {/* Benefits Grid - 2x3 desktop, 1x6 mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <FadeInWhenVisible key={index} direction="up" delay={index * 0.1}>
              <div className="group relative bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-[#2e8b75]/20 card-hover focus-seafoam">
                {/* Icon with seafoam line style */}
                <div className="w-16 h-16 bg-gradient-to-br from-[#e9f6f3] to-white rounded-2xl flex items-center justify-center mb-5 ring-1 ring-[#2e8b75]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {card.icon}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold text-[#1c4a44] mb-3 group-hover:text-[#2e8b75] transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-[#1c4a44]/80 leading-relaxed text-sm">
                    {card.description}
                  </p>
                </div>

                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2e8b75]/5 to-[#3da188]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                {/* Floating accent element */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#2e8b75]/30 rounded-full animate-[float_4s_ease-in-out_infinite]" />
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </div>
    </section>
  )
}