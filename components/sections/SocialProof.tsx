import { Users, Star, UserCheck, Calendar } from "lucide-react"
import { Section } from "@/components/common/Section"

export function SocialProof() {
  const stats = [
    {
      icon: <Users className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
      number: "10 000+",
      label: "vyplněných dotazníků"
    },
    {
      icon: <Star className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
      number: "4.8/5",
      label: "hodnocení"
    },
    {
      icon: <UserCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
      number: "200+",
      label: "fyzioterapeutů"
    },
    {
      icon: <Calendar className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
      number: "300 000+",
      label: "dostupných termínů"
    }
  ]

  return (
    <Section className="relative z-0 py-14 md:py-20">
      <div className="rounded-2xl ring-1 ring-black/5 bg-white/70 backdrop-blur-[2px] p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 transition-colors duration-150 ease-out">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
            <div className="text-emerald-900 text-3xl font-semibold">{stat.number}</div>
            <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
      </div>
    </Section>
  )
}
