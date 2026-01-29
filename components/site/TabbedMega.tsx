"use client"
import { ROUTES } from "@/src/config/routes"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import BodyBack from "@/components/site/icons/BodyBack"
import BodyNeck from "@/components/site/icons/BodyNeck"
import BodyShoulder from "@/components/site/icons/BodyShoulder"
import BodyKnee from "@/components/site/icons/BodyKnee"
import BodyPrevention from "@/components/site/icons/BodyPrevention"

type TabbedItem = {
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

type TabbedMegaProps = {
  data: {
    "Podle potíží": TabbedItem[]
    "Podle těla": TabbedItem[]
    "Podle cíle": TabbedItem[]
  }
}

export default function TabbedMega({ data }: TabbedMegaProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const renderPreviewSvg = (kind: TabbedItem["preview"]["svg"]) => {
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

  const renderTabContent = (items: TabbedItem[], tabKey: string) => {
    const activeItem = items[activeIndex] || items[0]

    return (
      <TabsContent value={tabKey} className="mt-0">
        <div className="grid md:grid-cols-[1fr,300px] gap-5">
          {/* LEFT: List of links */}
          <nav className="space-y-2" role="listbox" aria-label={`${tabKey} možnosti`}>
            {items.map(({ title, description, href, Icon }, i) => (
              <a
                key={title}
                href={href}
                className={cn(
                  "group flex items-start gap-3 rounded-lg p-3 transition will-change-transform",
                  "hover:-translate-y-0.5 hover:shadow-sm",
                  "hover:bg-gradient-to-r hover:from-emerald-100/60 hover:to-teal-50/50",
                  "focus-visible:ring-2 ring-emerald-500/60",
                  i === activeIndex && "bg-emerald-50/70 ring-emerald-200"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                role="option"
                aria-selected={i === activeIndex}
              >
                <span className={cn(
                  "shrink-0 grid place-content-center h-8 w-8 rounded-full",
                  "bg-emerald-100 text-emerald-700",
                  "transition-transform duration-200",
                  "group-hover:scale-105 group-hover:rotate-[2deg]",
                  i === activeIndex && "scale-105"
                )}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 group-hover:translate-x-0.5 transition">
                  <span className="block font-medium text-emerald-900 text-sm">{title}</span>
                  <span className="block text-xs text-emerald-700 line-clamp-1">{description}</span>
                </span>
              </a>
            ))}
          </nav>

          {/* RIGHT: Preview card */}
          <aside className="rounded-xl border bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4
                            flex flex-col justify-between" aria-live="polite">
            <div key={activeIndex} className="anim-enter">
              <div className="mb-3 text-emerald-600">
                {renderPreviewSvg(activeItem.preview.svg)}
              </div>
              <div className="text-sm text-emerald-800">
                <div className="font-medium text-emerald-900 mb-2">{activeItem.preview.heading}</div>
                <ul className="space-y-1 list-disc pl-4 text-xs">
                  {activeItem.preview.bullets.slice(0, 3).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test</Link>
              </Button>
            </div>
          </aside>
        </div>
      </TabsContent>
    )
  }

  return (
    <div className="w-[min(92vw,780px)] p-4">
      <Tabs defaultValue="Podle potíží" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="Podle potíží" className="text-xs">
            Podle potíží
          </TabsTrigger>
          <TabsTrigger value="Podle těla" className="text-xs">
            Podle těla
          </TabsTrigger>
          <TabsTrigger value="Podle cíle" className="text-xs">
            Podle cíle
          </TabsTrigger>
        </TabsList>

        {renderTabContent(data["Podle potíží"], "Podle potíží")}
        {renderTabContent(data["Podle těla"], "Podle těla")}
        {renderTabContent(data["Podle cíle"], "Podle cíle")}
      </Tabs>
    </div>
  )
}
