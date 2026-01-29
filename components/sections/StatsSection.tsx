"use client"

import { Users, Star, UserCheck } from "lucide-react"
import { FadeInWhenVisible } from "@/components/common/FadeInWhenVisible"

export function StatsSection() {
  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      value: "10 000+",
      caption: "lidí",
    },
    {
      icon: <Star className="w-6 h-6" />,
      value: "4,8/5",
      caption: "hodnocení od klientů",
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      value: "300 000+",
      caption: "návštěv ročně",
    }
  ]

  return (
    <section className="relative z-0 py-12" id="stats">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <FadeInWhenVisible key={index} direction="up" delay={index * 0.1}>
              <div className="rounded-xl border bg-white shadow-sm p-5 text-center hover:shadow transition-[colors,opacity,transform] duration-150 ease-out will-change-transform">
                <div className="mx-auto mb-3 grid place-items-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-emerald-900">{stat.value}</div>
                <div className="text-sm text-emerald-700/80">{stat.caption}</div>
              </div>
            </FadeInWhenVisible>
          ))}
        </div>
      </div>
    </section>
  )
}
