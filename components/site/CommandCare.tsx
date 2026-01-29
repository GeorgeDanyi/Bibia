"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Search, Bone, Stethoscope, HeartPulse, Footprints, ShieldCheck } from "lucide-react"
import { ROUTES } from "@/src/config/routes"

export type CareItem = {
  label: string
  value: string
  hint?: string
  icon?: React.ComponentType<any>
  href?: string
}

export default function CommandCare({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const problems: CareItem[] = useMemo(() => [
    { label: "Bolest zad", value: "back_pain", hint: "Enter", icon: Bone, href: `${ROUTES.questionnaire}?reason=back_pain` },
    { label: "Krční páteř", value: "neck", hint: "Enter", icon: Stethoscope, href: `${ROUTES.questionnaire}?reason=neck` },
    { label: "Rameno", value: "shoulder", hint: "Enter", icon: HeartPulse, href: `${ROUTES.questionnaire}?reason=shoulder` },
    { label: "Koleno", value: "knee", hint: "Enter", icon: Footprints, href: `${ROUTES.questionnaire}?reason=knee` },
  ], [])

  const bodyParts: CareItem[] = useMemo(() => [
    { label: "Páteř", value: "spine", hint: "Enter", icon: Bone, href: `${ROUTES.questionnaire}?reason=spine` },
    { label: "Horní část těla", value: "upper", hint: "Enter", icon: HeartPulse, href: `${ROUTES.questionnaire}?reason=upper` },
    { label: "Dolní část těla", value: "lower", hint: "Enter", icon: Footprints, href: `${ROUTES.questionnaire}?reason=lower` },
  ], [])

  const goals: CareItem[] = useMemo(() => [
    { label: "Úleva od bolesti", value: "relief", hint: "Enter", icon: ShieldCheck, href: `${ROUTES.questionnaire}?reason=relief` },
    { label: "Zlepšení mobility", value: "mobility", hint: "Enter", icon: Stethoscope, href: `${ROUTES.questionnaire}?reason=mobility` },
    { label: "Sportovní výkon", value: "performance", hint: "Enter", icon: Footprints, href: `${ROUTES.questionnaire}?reason=performance` },
  ], [])

  const actions: CareItem[] = useMemo(() => [
    { label: "Spustit test", value: "start_test", hint: "↩︎", icon: Search, href: ROUTES.questionnaire },
  ], [])

  // Global hotkeys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC")
      const cmd = isMac ? e.metaKey : e.ctrlKey
      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  // Close when clicking outside panel
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return
      if (containerRef.current && e.target instanceof Node && !containerRef.current.contains(e.target)) {
        onOpenChange(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open, onOpenChange])

  const handleSelect = (item: CareItem) => {
    if (item.href) router.push(item.href)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4"
      role="dialog"
      aria-modal
      aria-label="Najít péči"
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-md p-0 shadow-2xl overflow-hidden",
          "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95"
        )}
        data-state="open"
      >
        <Command>
          <div className="flex items-center gap-2 px-3 pt-3">
            <Search className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <CommandInput placeholder="Najdi péči podle potíží, části těla nebo cíle…" autoFocus />
            <kbd className="ml-auto text-[10px] text-muted-foreground">Esc</kbd>
          </div>
          <CommandEmpty>
            <div className="px-4 py-6 text-sm text-muted-foreground">Zkus: bolest zad, koleno…</div>
          </CommandEmpty>
          <CommandList className="max-h-[60vh] overflow-y-auto">
            <CommandGroup heading={<span className="text-[10px] uppercase tracking-wider" aria-hidden>Potíže</span>}>
              {problems.map((item) => (
                <CommandItem key={item.value} value={item.label} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                  <span className="grid place-content-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700">
                    {item.icon ? <item.icon className="h-4 w-4" aria-hidden /> : null}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  <kbd className="text-[10px] text-muted-foreground">Enter</kbd>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={<span className="text-[10px] uppercase tracking-wider" aria-hidden>Část těla</span>}>
              {bodyParts.map((item) => (
                <CommandItem key={item.value} value={item.label} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                  <span className="grid place-content-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700">
                    {item.icon ? <item.icon className="h-4 w-4" aria-hidden /> : null}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  <kbd className="text-[10px] text-muted-foreground">Enter</kbd>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={<span className="text-[10px] uppercase tracking-wider" aria-hidden>Cíl terapie</span>}>
              {goals.map((item) => (
                <CommandItem key={item.value} value={item.label} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                  <span className="grid place-content-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700">
                    {item.icon ? <item.icon className="h-4 w-4" aria-hidden /> : null}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  <kbd className="text-[10px] text-muted-foreground">Enter</kbd>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={<span className="text-[10px] uppercase tracking-wider" aria-hidden>Akce</span>}>
              {actions.map((item) => (
                <CommandItem key={item.value} value={item.label} onSelect={() => handleSelect(item)} className="flex items-center gap-3">
                  <span className="grid place-content-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-700">
                    {item.icon ? <item.icon className="h-4 w-4" aria-hidden /> : null}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  <kbd className="text-[10px] text-muted-foreground">Enter</kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
