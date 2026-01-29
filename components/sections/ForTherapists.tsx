import Link from "next/link"
import { Button } from "@/components/ui/button"
import Section, { SectionHeader } from "@/components/common/Section"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"
import { Stethoscope } from "lucide-react"

export function ForTherapists() {
  return (
    <Section tone="plain" pad="lg" className="relative z-0 py-14 md:py-20">
      <div className="container mx-auto px-4 relative z-10 min-h-[320px] md:min-h-[380px]">
        <FadeInWhenVisible direction="up" delay={0.1}>
          <div className="rounded-2xl border bg-emerald-50/50 p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-6xl mx-auto">
            {/* Left: Content */}
            <div className="space-y-4">
              <SectionHeader
                title="Jsi fyzioterapeut?"
                description="Přidej se k Bibia, získej nové klienty bez starostí s marketingem a spravuj profil na jednom místě."
                className="text-left"
              />
              <div className="pt-2">
                <Button size="lg" variant="secondary" asChild className="focus-visible:ring-2 focus-visible:ring-emerald-500 transition-[colors,opacity,transform] duration-150 ease-out will-change-transform">
                  <Link href="/pro-terapeuty">Chci se přidat jako terapeut</Link>
                </Button>
              </div>
            </div>

            {/* Right: Illustration placeholder */}
            <div className="flex justify-center md:justify-end">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <Stethoscope className="w-16 h-16 md:w-20 md:h-20 text-emerald-600" />
              </div>
            </div>
          </div>
        </FadeInWhenVisible>
      </div>
    </Section>
  )
}
