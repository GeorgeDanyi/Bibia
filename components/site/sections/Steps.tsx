"use client"

import Link from "next/link"
import { ROUTES } from "@/src/config/routes"

export function Steps() {
  const steps = [
    {
      number: "01",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: "Vyplň dotazník",
      description: "Zabere ti to necelé 2 minuty."
    },
    {
      number: "02",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: "Porovnej možnosti",
      description: "Podle místa, ceny a hodnocení."
    },
    {
      number: "03",
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Rezervuj termín",
      description: "Potvrzení přijde hned."
    }
  ]

  return (
    <section className="relative py-16 md:py-20" id="steps">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1c4a44] mb-4">
            Od potíží k úlevě v pár krocích
          </h2>
          <p className="text-lg md:text-xl text-[#2e8b75] max-w-3xl mx-auto">
            Rezervace je rychlá a přehledná. Stačí tři kroky:
          </p>
        </div>

        <div className="relative">
          {/* Dotted connector line - hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-0.5">
            <div className="flex justify-between items-center h-full">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#3da188]/30"></div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-[#3da188]/30 via-[#3da188]/20 to-[#3da188]/30 border-dashed border-t border-[#3da188]/40"></div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-[#3da188]/30 to-transparent"></div>
            </div>
          </div>

          <div className="grid gap-8 md:gap-12 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="group relative"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <div className="relative rounded-2xl bg-white/80 backdrop-blur-sm p-8 md:p-10 shadow-lg/20 border border-white/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl/30 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 focus-visible:ring-offset-2">
                  {/* Step number with gradient circle */}
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2e8b75] to-[#3da188] flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                        <span className="text-xl font-bold text-white">{step.number}</span>
                      </div>
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 h-16 w-16 rounded-full bg-gradient-to-br from-[#2e8b75] to-[#3da188] opacity-20 blur-md group-hover:opacity-30 transition-opacity duration-300"></div>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-[#e9f6f3] flex items-center justify-center text-[#2e8b75] group-hover:bg-[#bfe9df] group-hover:scale-110 transition-all duration-300">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-semibold text-[#1c4a44] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#2e8b75] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 md:mt-16 flex justify-center">
          <Link 
            href={ROUTES.questionnaire} 
            className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2e8b75] to-[#3da188] px-8 py-4 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 focus-visible:ring-offset-2"
            aria-label="Spustit dotazník a najít fyzioterapeuta"
          >
            <span className="text-lg font-semibold">Začít dotazník</span>
            <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}