"use client"
import { Button } from "@/components/ui/button"
import Section from "@/components/common/Section"
import { ROUTES } from "@/src/config/routes"

export default function CTA() {
  return (
    <Section tone="seafoam" pad="lg" topDivider="wave">
      <div className="mx-auto max-w-3xl">
        <div className="bg-glass rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-emerald-900">Připravený na úlevu?</h2>
          <p className="mt-2 text-slate-700">Začni krátkým testem a najdi správného fyzioterapeuta.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button asChild data-hover>
              <a href={ROUTES.questionnaire} aria-label="Spustit dotazník a začít hledat fyzioterapeuta">Začni hledat hned</a>
            </Button>
            <Button variant="outline" data-hover>
              <a href="#faq">Nejčastější dotazy</a>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

