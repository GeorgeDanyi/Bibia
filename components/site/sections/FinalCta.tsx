import { ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/src/config/routes";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      {/* Softer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50">
        {/* Subtle decorative elements */}
        <div className="absolute top-16 left-16 w-20 h-20 bg-emerald-200/20 rounded-full animate-gentleFloat" />
        <div className="absolute bottom-16 right-16 w-16 h-16 bg-teal-200/20 rounded-full animate-gentleFloat" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-emerald-300/15 rounded-full animate-gentleFloat" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-12 md:py-16 text-center">
          {/* Main headline with sparkle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="size-5 md:size-6 text-emerald-600 animate-pulse" aria-hidden />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-emerald-900">
              Začni ještě dnes
            </h2>
            <Sparkles className="size-5 md:size-6 text-emerald-600 animate-pulse" aria-hidden />
          </div>
          
          {/* Subheadline */}
          <p className="text-base md:text-lg text-emerald-700/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Vyplň krátký dotazník a během chvilky najdeš fyzioterapeuta, který ti opravdu sedne.
          </p>

          {/* Dual CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={ROUTES.questionnaire}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#1F705D] to-[#2A8B74] text-white font-bold px-10 py-4 h-14 shadow-[0_8px_24px_rgba(31,112,93,0.25)] hover:shadow-[0_12px_32px_rgba(31,112,93,0.35)] hover:-translate-y-1 hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white text-lg"
              aria-label="Spustit dotazník a najít fyzioterapeuta"
            >
              Najít fyzioterapeuta
              <ArrowRight className="ml-2 size-5" aria-hidden />
            </a>
            <a
              href="/#steps"
              className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-8 py-4 h-12 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Jak to funguje
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
