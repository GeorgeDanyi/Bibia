"use client"

import Link from "next/link"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"
import { ROUTES } from "@/src/config/routes"

export function Steps() {
  const steps = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
          <path d="M16.5 6l1.5 1.5L21 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      ),
      title: "Vyplň dotazník",
      description: "Zabere ti to 2 minuty a pomůže najít vhodného terapeuta."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="3" fill="currentColor" fillOpacity="0.3" />
          <path d="M8 8l6 6" stroke="currentColor" strokeLinecap="round" />
          <circle cx="18" cy="6" r="2" fill="currentColor" fillOpacity="0.6" />
          <circle cx="6" cy="18" r="2" fill="currentColor" fillOpacity="0.6" />
        </svg>
      ),
      title: "Porovnej možnosti",
      description: "Vyber si z ověřených terapeutů podle zkušeností, lokality a hodnocení."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#1c4a44]" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" />
          <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
          <circle cx="12" cy="16" r="2" fill="currentColor" fillOpacity="0.6" />
          <path d="M10 16h4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      ),
      title: "Rezervuj termín",
      description: "Najdi volný termín a objednej se online."
    }
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#e9f6f3] py-20 md:py-24">
      {/* Subtle animated background elements */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#2e8b75]/8 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-[#3da188]/6 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c4a44] mb-4">
            Od potíží k úlevě v pár krocích
          </h2>
          <p className="text-lg sm:text-xl text-[#1c4a44]/80 max-w-2xl mx-auto leading-relaxed">
            Rezervace je rychlá a přehledná.
          </p>
        </div>

        {/* Steps Grid with Animated Connector */}
        <div className="relative">
          {/* Animated wave connector (desktop only) */}
          <svg
            className="absolute top-1/2 left-0 right-0 hidden lg:block pointer-events-none z-0 transform -translate-y-1/2"
            viewBox="0 0 1000 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2e8b75" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#3da188" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2e8b75" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d="M0,20 Q250,5 500,20 T1000,20"
              stroke="url(#waveGradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10 5"
              className="animate-[wave_8s_ease-in-out_infinite]"
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, index) => (
              <FadeInWhenVisible key={index} direction="up" delay={index * 0.2}>
                <div className="group relative">
                      {/* Step Card */}
                      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#2e8b75]/20 card-hover-lg focus-seafoam">
                    {/* Big Numerals */}
                    <div className="absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c4a44] to-[#2e8b75] text-white font-bold text-xl flex items-center justify-center shadow-xl">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#e9f6f3] to-white rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#2e8b75]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {step.icon}
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1c4a44] mb-4 group-hover:text-[#2e8b75] transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-[#1c4a44]/80 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#2e8b75]/5 to-[#3da188]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Floating accent elements */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#2e8b75]/30 rounded-full animate-[float_4s_ease-in-out_infinite]" />
                    <div className="absolute -bottom-3 -left-3 w-3 h-3 bg-[#3da188]/30 rounded-full animate-[float_5s_ease-in-out_infinite]" />
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <Link 
                href={ROUTES.questionnaire}
                className="group inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-[#1c4a44] to-[#2e8b75] px-10 py-4 text-aaa-contrast font-bold shadow-xl btn-hover focus-seafoam"
                aria-label="Spustit dotazník a najít fyzioterapeuta"
              >
            <span>Začít dotazník</span>
            <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm text-[#1c4a44]/70 mt-4">
            Zabere jen 2 minuty • Žádný závazek
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { 
            stroke-dashoffset: 0;
            opacity: 0.3;
          }
          50% { 
            stroke-dashoffset: -30;
            opacity: 0.8;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  )
}
