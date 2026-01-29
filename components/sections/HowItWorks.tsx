"use client"
import BadgePill from "@/components/ui/BadgePill"
import FeatureCard from "@/components/ui/FeatureCard"
import Section from "@/components/common/Section"

export default function HowItWorks() {
  const items = [
    {
      title: "Bolí tě záda od práce u počítače?",
      desc: "",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" className="fill-current opacity-10" />
          <path d="M7 9h10M7 13h6" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Zranil ses při sportu?",
      desc: "",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
          <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" className="fill-current opacity-10" />
          <circle cx="12" cy="9" r="2.5" className="stroke-current" strokeWidth="1.8" fill="none" />
        </svg>
      ),
    },
    {
      title: "Potřebuješ odbornou pomoc, abys byl zase fit?",
      desc: "",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" className="fill-current opacity-10" />
          <path d="M8 2v4M16 2v4M3 9h18" className="stroke-current" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <Section tone="canvas" pad="md" topDivider="wave" bottomDivider="soft" className="relative z-0 py-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <BadgePill tone="emerald">Jak to funguje</BadgePill>
        <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-slate-900">Od potíží k úlevě v pár krocích</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {items.map((it, i) => (
          <FeatureCard key={i} icon={it.icon} title={it.title} desc={it.desc} />
        ))}
      </div>
    </Section>
  )
}

