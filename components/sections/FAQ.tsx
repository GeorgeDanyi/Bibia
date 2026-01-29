"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"

export function FAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null)

  const faqData = [
    {
      id: "questionnaire-time",
      question: "Jak dlouho trvá vyplnění dotazníku?",
      answer: "👉 Zabere ti to jen pár minut, většinou 3–5. Stačí kliknout, vyplnit a máš hotovo.",
      icon: "⏱"
    },
    {
      id: "is-free",
      question: "Je služba zdarma?",
      answer: "👉 Ano, používání Bibia tě nic nestojí. Platíš jen za samotnou terapii u fyzioterapeuta.",
      icon: "💸"
    },
    {
      id: "booking-process",
      question: "Jak funguje rezervace termínu?",
      answer: "👉 Vybereš si terapeuta, zvolíš čas a hned máš termín potvrzený. Žádné volání ani složité domlouvání.",
      icon: "📅"
    },
    {
      id: "change-cancel",
      question: "Mohu změnit nebo zrušit rezervaci?",
      answer: "👉 Jasně, stačí pár kliknutí. Vše vyřešíš přímo v systému, jednoduše a bez stresu.",
      icon: "🔄"
    },
    {
      id: "insurance-contribution",
      question: "Jak získat příspěvek od pojišťovny?",
      answer: "👉 U každé pojišťovny to máme přehledně vysvětlené. Stačí si ověřit, co ti náleží, a my tě navedeme krok za krokem.",
      icon: "🏥"
    }
  ]

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  }

  const handleValueChange = (value: string) => {
    setOpenItem(value === openItem ? null : value)
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0fdf4] to-[#e9f7f3] py-16 md:py-20">
        {/* animated background elements */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#3da188]/6 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#2e8b75]/4 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeInWhenVisible direction="up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#103B34] mb-4">
                Často kladené otázky
              </h2>
              <p className="text-lg text-[#4E6E67] max-w-2xl mx-auto">
                Odpovědi na nejčastější otázky o Bibia
              </p>
            </div>
          </FadeInWhenVisible>

          {/* Accordion wrapper */}
          <FadeInWhenVisible direction="up" delay={0.2}>
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(21,94,82,0.08)] border border-[#A6E7D8]/30">
              <Accordion
                type="single"
                collapsible
                value={openItem || ""}
                onValueChange={handleValueChange}
                className="space-y-4"
              >
                {faqData.map((item, index) => {
                  const isOpen = openItem === item.id
                  
                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="border border-[#A6E7D8]/40 rounded-2xl px-5 py-3 data-[state=open]:bg-[#E9F7F3]/60 transition-all duration-300 hover:border-[#2FA387]/40 hover:shadow-sm"
                    >
                      <AccordionTrigger 
                        className="flex items-center gap-4 text-[#103B34] font-bold py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180 transition-all duration-300"
                        aria-expanded={isOpen}
                        aria-controls={`content-${item.id}`}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2FA387] to-[#2A8B74] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <span className="text-left text-lg sm:text-xl font-bold">{item.question}</span>
                        <svg 
                          className="w-5 h-5 text-[#2FA387] transition-transform duration-300 flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </AccordionTrigger>
                      <AccordionContent 
                        id={`content-${item.id}`}
                        className="pb-4 pt-1 text-[#4E6E67] leading-relaxed data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down pl-16 text-base md:text-lg"
                        role="region"
                        aria-labelledby={`trigger-${item.id}`}
                      >
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>
    </>
  )
}
