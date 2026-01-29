import { ArrowRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/src/config/routes";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      {/* Lighter gradient background with playful waves */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500">
        {/* Soft playful wave elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-300/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-300/30 via-transparent to-transparent" />
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 w-24 h-24 bg-white/15 rounded-full animate-gentleFloat" />
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/15 rounded-full animate-gentleFloat" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/15 rounded-full animate-gentleFloat" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 bg-emerald-600/90 backdrop-blur-sm text-white">
        <div className="mx-auto max-w-4xl px-5 md:px-8 py-16 md:py-20 text-center">
          {/* Main headline with sparkle */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="size-6 md:size-7 text-emerald-200 animate-pulse" aria-hidden />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Jsi připraven začít cestu ke zdravějšímu tělu?
            </h2>
            <Sparkles className="size-6 md:size-7 text-emerald-200 animate-pulse" aria-hidden />
          </div>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-emerald-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Najdi si ověřeného fyzioterapeuta během pár minut.
          </p>

          {/* Dual CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={ROUTES.questionnaire}
              className="inline-flex items-center justify-center rounded-xl bg-white text-emerald-700 font-semibold px-8 py-4 h-14 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
            >
              Spustit test zájmu
              <ArrowRight className="ml-2 size-5" aria-hidden />
            </a>
            <a
              href="/#steps"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/80 text-white hover:bg-white/10 hover:border-white px-8 py-4 h-14 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
            >
              Zjistit, jak to funguje
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
