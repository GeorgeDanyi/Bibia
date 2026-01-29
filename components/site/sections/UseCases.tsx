"use client"

import React, { useState } from "react"
import { Stethoscope, Activity, ShieldCheck, Dumbbell, HeartPulse, Droplet, ArrowRight } from "lucide-react"
import { ROUTES } from "@/src/config/routes"

export function UseCases() {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      id: "uleva",
      label: "Úleva od bolesti",
      icon: Stethoscope,
      content: [
        { icon: Activity, title: "Bolest zad / krční páteře", description: "Komplexní řešení a úleva od bolesti." },
        { icon: HeartPulse, title: "Rehabilitace po úrazech", description: "Návrat k plné kondici bezpečně a rychle." },
        { icon: Droplet, title: "Záněty a otoky", description: "Cílené techniky pro zklidnění potíží." }
      ]
    },
    {
      id: "drzeni",
      label: "Držení těla",
      icon: Activity,
      content: [
        { icon: Activity, title: "Náprava vadného držení", description: "Rovnější záda, menší přetížení." },
        { icon: ShieldCheck, title: "Skolióza a kyfóza", description: "Individuální vedení a cvičení." },
        { icon: Stethoscope, title: "Bolesti z práce u PC", description: "Prevence přetížení, zdravé návyky." }
      ]
    },
    {
      id: "prevence",
      label: "Prevence",
      icon: ShieldCheck,
      content: [
        { icon: ShieldCheck, title: "Cvičení proti bolestem", description: "Stabilita, mobilita, jistější pohyb." },
        { icon: HeartPulse, title: "Těhotenství a po porodu", description: "Bezpečné posílení a dýchání." },
        { icon: Droplet, title: "Prevence přetížení", description: "Technika pohybu a regenerace." }
      ]
    },
    {
      id: "vykon",
      label: "Sportovní výkon",
      icon: Dumbbell,
      content: [
        { icon: HeartPulse, title: "Rychlejší regenerace", description: "Zkrácení doby zotavení." },
        { icon: Activity, title: "Sportovní zranění", description: "Léčba a návrat do formy." },
        { icon: Dumbbell, title: "Flexibilita a síla", description: "Zlepšení výkonu bez bolestí." }
      ]
    }
  ]

  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-seafoam-50/30">
      {/* Decorative wave at top */}
      <div className="absolute top-0 left-0 right-0 h-20 opacity-[0.05]">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink/90 text-center">
            Fyzioterapie ti pomůže, když…
          </h2>
          <p className="mt-2 text-base md:text-lg text-ink/70 text-center max-w-3xl mx-auto">
            Ať už řešíš bolest, prevenci nebo sportovní výkon, fyzioterapie tě podpoří v každé fázi.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 ${
                activeTab === index
                  ? 'bg-seafoam-700 text-white shadow-md'
                  : 'border border-seafoam-300 bg-white text-seafoam-700 hover:bg-seafoam-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-10">
          {tabs[activeTab].content.map((item, index) => (
            <a
              key={index}
              href={ROUTES.questionnaire}
              className="h-full flex items-start gap-3 rounded-xl border border-seafoam-200 bg-white/90 shadow-sm px-6 py-5 hover:-translate-y-[2px] hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300"
              aria-label={`${item.title} - ${item.description}`}
            >
              {/* Icon wrapper */}
              <div className="w-10 h-10 rounded-full bg-seafoam-100 text-seafoam-700 flex items-center justify-center">
                {React.createElement(item.icon, { className: "w-5 h-5" })}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="text-sm text-ink/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href={ROUTES.questionnaire}
            className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-seafoam-600 to-teal-600 px-7 py-3 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seafoam-300 focus-visible:ring-offset-2"
            aria-label="Spustit dotazník a najít fyzioterapeuta"
          >
            <span>Najít terapeuta</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}