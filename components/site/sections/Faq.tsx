"use client"

import { useState } from "react"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"
import {
  Clock3, WalletMinimal, CalendarDays, Undo2, HandCoins,
  Navigation, MapPin, HeartPulse, ClipboardList, ShieldCheck
} from "lucide-react"

// Custom FAQ Item Component
function FaqItem({ icon, question, answer, defaultOpen = false }: {
  icon: React.ReactNode;
  question: string;
  answer: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const btnId = `faq-${Math.random().toString(36).substr(2, 9)}`;
  const panelId = `${btnId}-panel`;

  return (
    <div
      className={[
        "rounded-2xl border transition-colors",
        open
          ? "bg-emerald-50 border-emerald-900/15 shadow-[inset_0_0_0_1px_rgba(16,78,61,0.06)]"
          : "bg-white border-emerald-900/10 hover:bg-emerald-50/60"
      ].join(" ")}
    >
      <button
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 py-3.5 md:py-4 px-4 md:px-6 text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-emerald-600/50 focus-visible:outline-offset-2"
      >
        <span aria-hidden className="shrink-0 grid place-items-center size-7 md:size-8 rounded-full bg-emerald-100 text-emerald-700">
          {icon}
        </span>
        <span className="flex-1 text-[15px] md:text-[16px] leading-6 md:leading-7 font-medium text-emerald-950">
          {question}
        </span>
        <svg
          aria-hidden
          className={[
            "shrink-0 size-5 md:size-5.5 text-emerald-900/70 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={[
          "grid transition-all",
          open
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
          "duration-200 ease-out motion-reduce:transition-none"
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-6 pb-4 md:pb-5 text-[15px] leading-7 text-emerald-950/90">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const faqs = [
    { q: "Jak dlouho trvá vyplnění dotazníku?", a: "Stačí pár minut. Odpovíš na pár jednoduchých otázek a hned víme, co ti sedne nejlíp.", icon: <Clock3 className="size-4" /> },
    { q: "Je služba zdarma?", a: "Vyplnění dotazníku i doporučení terapeutů je zdarma. Platíš až za službu terapeuta.", icon: <WalletMinimal className="size-4" /> },
    { q: "Jak funguje rezervace termínu?", a: "Vybereš si terapeuta a čas, potvrdíš rezervaci a přijde ti e-mail s detaily. Vše zvládneš online.", icon: <CalendarDays className="size-4" /> },
    { q: "Mohu změnit nebo zrušit rezervaci?", a: "Ano. V potvrzovacím e-mailu najdeš odkaz na změnu/zrušení. U každého terapeuta platí jeho storno podmínky.", icon: <Undo2 className="size-4" /> },
    { q: "Jak získat příspěvek od pojišťovny?", a: "Některé pojišťovny přispívají 500–2000 Kč/rok. V profilu terapeuta nebo v našem přehledu uvidíš, co je potřeba k proplacení.", icon: <HandCoins className="size-4" /> },
    { q: "Jak rychle se dostanu k fyzioterapeutovi?", a: "Často do pár dnů. Uvidíš rovnou volné termíny a vybereš si, co ti vyhovuje.", icon: <Navigation className="size-4" /> },
    { q: "Můžu si vybrat terapeuta podle místa, kde bydlím?", a: "Jasně. Filtrovat jde podle lokality, ceny, specializace i hodnocení.", icon: <MapPin className="size-4" /> },
    { q: "Pomůže Bibia i s jinými potížemi než jsou záda?", a: "Ano. Řešíme široké spektrum—od krční páteře a ramen, přes kolena a kotníky, až po poúrazovou rehabilitaci či sportovní výkon.", icon: <HeartPulse className="size-4" /> },
    { q: "Dostanu po návštěvě doporučená cvičení domů?", a: "Většinou ano. Terapeut ti po sezení pošle jednoduchý plán a ukáže, jak správně cvičit.", icon: <ClipboardList className="size-4" /> },
    { q: "Jsou terapeuti prověření?", a: "Ano. Kontrolujeme kvalifikaci, praxi i hodnocení klientů, aby doporučení byla spolehlivá.", icon: <ShieldCheck className="size-4" /> },
  ];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <section className="py-14 md:py-18 bg-emerald-50/40">
        <div className="mx-auto max-w-4xl px-5 md:px-6">
          <FadeInWhenVisible direction="up">
            <header className="text-center mb-8 md:mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-emerald-950">
                Často se nás ptáte ✨
              </h2>
              <p className="mt-3 text-emerald-950/70 text-[15px] md:text-[16px]">
                Odpovědi na to, co vás nejvíc zajímá o Bibia
              </p>
            </header>
          </FadeInWhenVisible>

          <FadeInWhenVisible direction="up" delay={0.2}>
            <div className="flex flex-col gap-3 md:gap-4">
              {faqs.map((item, i) => (
                <FaqItem
                  key={i}
                  icon={item.icon}
                  question={item.q}
                  answer={item.a}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </>
  )
}
