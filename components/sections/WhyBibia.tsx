import Section, { SectionHeader } from "@/components/common/Section"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"
import { Zap, ShieldCheck, MousePointerClick } from "lucide-react"

export function WhyBibia() {
  const benefits = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Najdeš toho pravého",
      description: "Podle sportu, diagnózy nebo životní situace.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Ušetříš čas i nervy",
      description: "Přehledný výběr terapeutů a snadná rezervace.",
    },
    {
      icon: <MousePointerClick className="w-5 h-5" />,
      title: "Důvěryhodná platforma",
      description: "Ověření odborníci a recenze pacientů.",
    },
  ]

  return (
    <Section id="how" tone="plain" pad="lg" className="relative bg-emerald-50/40">
      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          title="Proč právě Bibia?"
          description="Stručně, přehledně a s důrazem na to důležité."
        />

        <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <FadeInWhenVisible key={index} direction="up" delay={index * 0.1}>
              <div className="group rounded-2xl border border-emerald-900/5 bg-white/80 backdrop-blur-sm p-5 md:p-6 shadow-[0_1px_0_rgba(2,6,23,0.04)] hover:shadow-md transition group-hover:-translate-y-0.5">
                <div className="h-9 w-9 rounded-full grid place-items-center bg-emerald-100 text-emerald-700 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-emerald-900 font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-emerald-700/80">{benefit.description}</p>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </div>
    </Section>
  )
}
