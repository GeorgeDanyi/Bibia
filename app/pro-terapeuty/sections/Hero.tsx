import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-seafoam-50 via-white to-seafoam-100 py-24 md:py-32 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-seafoam-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-seafoam-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-seafoam-900 mb-6 leading-tight animate-fade-up mt-8">
          Přidej se k nám jako{" "}
          <span className="relative inline-block">
            <span className="relative z-10">fyzioterapeut</span>
            <span className="absolute bottom-2 left-0 right-0 h-3 bg-seafoam-300/40 -z-0 transform -skew-x-12"></span>
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-seafoam-700 mb-6 max-w-3xl mx-auto leading-relaxed animate-fade-up-delay-2">
          Spojujeme pacienty s kvalitními fyzioterapeuty. Získej nové klienty a rozšiř svou praxi s naší platformou.
        </p>

        {/* Microcopy */}
        <p className="text-sm md:text-base text-seafoam-600 mb-10 animate-fade-up-delay-3">
          Odpovídáme obvykle do 2 pracovních dnů
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up-delay-3">
          <Button
            asChild
            size="lg"
            className="group bg-gradient-to-r from-seafoam-600 to-seafoam-500 hover:from-seafoam-500 hover:to-seafoam-400 text-white text-lg px-8 py-7 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <a href="#form">
              Chci spolupracovat
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-seafoam-700 border-2 border-seafoam-300 hover:bg-seafoam-50 hover:border-seafoam-400 text-lg px-8 py-7 rounded-full transition-all duration-300"
          >
            <Link href="/contact">Kontaktovat nás</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
