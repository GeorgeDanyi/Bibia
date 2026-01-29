import Link from "next/link"
import { ROUTES } from "@/src/config/routes"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import BodyBack from "@/components/site/icons/BodyBack"
import BodyNeck from "@/components/site/icons/BodyNeck"
import BodyShoulder from "@/components/site/icons/BodyShoulder"
import BodyKnee from "@/components/site/icons/BodyKnee"
import BodyPrevention from "@/components/site/icons/BodyPrevention"

type Item = {
  title: string
  description: string
  href: string
  Icon: React.ComponentType<any>
  preview: {
    svg: "back" | "neck" | "shoulder" | "knee" | "prevention"
    heading: string
    bullets: string[]
  }
}

export default function DropdownPanel({
  items,
  rightTitle = "Nevíš kde začít?",
  rightText = "Krátký test ti doporučí nejvhodnější postup.",
  rightCtaHref = ROUTES.questionnaire,
  className = "",
}: {
  items: Item[]
  rightTitle?: string
  rightText?: string
  rightCtaHref?: string
  className?: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [items])

  const renderPreviewSvg = (kind: Item["preview"]["svg"]) => {
    switch (kind) {
      case "back":
        return <BodyBack />
      case "neck":
        return <BodyNeck />
      case "shoulder":
        return <BodyShoulder />
      case "knee":
        return <BodyKnee />
      case "prevention":
      default:
        return <BodyPrevention />
    }
  }

  return (
    <div className={`w-[min(92vw,780px)] p-6 rounded-2xl border bg-white/90 backdrop-blur-md shadow-2xl ${className}`}>
      <div className="grid md:grid-cols-[1fr,300px] gap-6">
        {/* LEFT list */}
        <nav className="space-y-2" role="listbox" aria-label="Možnosti">
          {items.map(({ title, description, href, Icon }, i) => (
            <a key={title} href={href}
               className={cn(
                 "group flex items-start gap-3 rounded-lg p-3 md:p-4",
                 "transition will-change-transform",
                 "hover:-translate-y-0.5 hover:shadow-sm",
                 "hover:bg-emerald-50/60",
                 "focus-visible:ring-2 ring-emerald-500/60",
                 i === activeIndex && "bg-emerald-50/70 ring-emerald-200"
               )}
               onMouseEnter={() => setActiveIndex(i)}
               onFocus={() => setActiveIndex(i)}
               role="option"
               aria-selected={i === activeIndex}
            >
              <span className={cn(
                "shrink-0 grid place-content-center h-10 w-10 rounded-full",
                "bg-emerald-100 text-emerald-700",
                "transition-transform duration-200",
                "group-hover:scale-105 group-hover:rotate-[2deg]",
                i === activeIndex && "scale-105"
              )}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 group-hover:translate-x-0.5 transition">
                <span className="block font-medium text-emerald-900">{title}</span>
                <span className="block text-sm text-emerald-700 line-clamp-2">{description}</span>
              </span>
            </a>
          ))}
        </nav>

        {/* RIGHT rail */}
        <aside className="rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-5 flex flex-col justify-between" aria-live="polite">
          <div key={activeIndex} className="anim-enter">
            <div className="mb-3 text-emerald-600">
              {renderPreviewSvg(items[activeIndex]?.preview.svg)}
            </div>
            <div className="text-sm text-emerald-800">
              <div className="font-medium text-emerald-900">{items[activeIndex]?.preview.heading || rightTitle}</div>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(items[activeIndex]?.preview.bullets || []).slice(0,3).map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="secondary" asChild>
              <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
