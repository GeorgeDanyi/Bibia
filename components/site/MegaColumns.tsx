"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/src/config/routes"

export type MegaSection = {
  heading: string
  links: { title: string; href: string }[]
}

export default function MegaColumns({
  sections,
  featured = {
    heading: "Nevíš kde začít?",
    text: "Krátký test ti doporučí nejvhodnější postup.",
    ctaHref: ROUTES.questionnaire,
    ctaLabel: "Spustit test",
  },
  className = "",
}: {
  sections: [MegaSection, MegaSection, MegaSection]
  featured?: { heading: string; text: string; ctaHref: string; ctaLabel: string }
  className?: string
}) {
  return (
    <div className={cn("z-50 w-[min(92vw,780px)] p-6 rounded-2xl border bg-white/90 backdrop-blur-md shadow-2xl", className)}>
      <div className="grid md:grid-cols-4 gap-6">
        {/* Columns 1-3 */}
        {sections.slice(0, 3).map((section, idx) => (
          <nav key={idx} aria-label={section.heading} className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600" aria-hidden>
              {section.heading}
            </div>
            <ul className="space-y-2">
              {section.links.map((l) => (
                <li key={l.title}>
                  <Link
                    href={l.href}
                    className="block text-emerald-900 hover:text-emerald-700 hover:underline underline-offset-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-md"
                    role="menuitem"
                  >
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Column 4: Featured tile */}
        <aside className="rounded-xl border bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 flex flex-col gap-3">
          <div>
            <div className="text-sm font-medium text-emerald-900">{featured.heading}</div>
            <p className="text-sm text-emerald-800/90">{featured.text}</p>
          </div>
          <div>
            <Button variant="secondary" asChild>
              <Link href={featured.ctaHref}>{featured.ctaLabel}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
