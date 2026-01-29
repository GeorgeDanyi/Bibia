"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import React from "react"
import { Users, Star, Building } from "lucide-react"
import { ROUTES } from "@/src/config/routes"

export function Hero() {
  return (
    <section className="relative bg-emerald-950 text-emerald-50">
      <div className="max-w-screen-xl mx-auto grid gap-8 md:grid-cols-[minmax(0,1fr),480px] items-center px-4 pt-10 md:pt-16 pb-14">
        {/* Left column */}
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-emerald-50 leading-tight">
            Najdi si fyzioterapeuta za pár minut
          </h1>
          <p className="text-emerald-100/90 max-w-prose mt-4 leading-relaxed">
            Spojíme tě s odborníky, kteří rozumí tvému problému. Stačí vyplnit krátký dotazník a hned uvidíš volné možnosti.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-start gap-3">
            <Button size="lg" asChild className="h-12 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900">
              <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test zdarma</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild className="h-12 text-emerald-100 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900">
              <Link href="/#steps">Jak to funguje</Link>
            </Button>
          </div>

          {/* Stat pills - single compact group */}
          <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            {[
              { icon: <Users className="w-5 h-5 text-emerald-200" />, text: "10 000+ lidí už test vyzkoušelo" },
              { icon: <Star className="w-5 h-5 text-emerald-200" />, text: "4,8/5 spokojenost" },
              { icon: <Building className="w-5 h-5 text-emerald-200" />, text: "300 000+ návštěv ročně" },
            ].map((stat, i) => (
              <div key={i} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-sm">
                {stat.icon}
                <span className="text-emerald-50/85">{stat.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: visual card */}
        <div className="relative aspect-[4/5] md:aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 bg-emerald-900/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.45)]">
          <Image
            src="/hero-person.webp"
            alt="Fyzioterapeut pomáhá klientovi s ramenem"
            fill
            priority
            sizes="(min-width: 1024px) 480px, (min-width: 768px) 480px, 100vw"
            decoding="async"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/25 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl opacity-20" aria-hidden />
        </div>
      </div>
      {/* Wave separator */}
      <div className="absolute -bottom-[1px] left-0 right-0 h-[96px] md:h-[120px]" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C360,80 720,40 1080,60 C1260,70 1440,20 1440,20 L1440,120 L0,120 Z" fill="#ecfdf5" />
        </svg>
      </div>
    </section>
  )
}
