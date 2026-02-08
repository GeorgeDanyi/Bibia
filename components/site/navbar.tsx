"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, Stethoscope, HeartPulse, Bone, ShieldCheck, Search, Activity, Move, StretchHorizontal, StretchVertical, HelpCircle, UserPlus, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrollSpy } from "./useScrollSpy"
import { useOnScrollHeader } from "./useOnScrollHeader"
import { useHasScrolled } from "@/lib/useScrollY"
import { ROUTES } from "@/src/config/routes"
import { UserDropdown } from "./UserDropdown"

// Simple therapy cards data
const THERAPY_CARDS = [
  {
    title: "Bolesti zad",
    subtitle: "Podle potíží",
    href: "/terapie/bolesti-zad",
    icon: Activity,
  },
  {
    title: "Krční páteř",
    subtitle: "Podle potíží",
    href: "/terapie/krcni-pater",
    icon: StretchVertical,
  },
  {
    title: "Rameno",
    subtitle: "Podle potíží",
    href: "/terapie/rameno",
    icon: Move,
  },
  {
    title: "Koleno",
    subtitle: "Podle potíží",
    href: "/terapie/koleno",
    icon: Bone,
  },
  {
    title: "Střed těla (CORE)",
    subtitle: "Podle těla",
    href: "/terapie/core",
    icon: HeartPulse,
  },
  {
    title: "Zlepšení mobility",
    subtitle: "Podle cíle",
    href: "/terapie/mobilita",
    icon: StretchHorizontal,
  },
]

// Premium Terapie mini mega-menu (2-column grid with right rail)
function TerapieMenuContent() {
  const items = [
    { title: "Bolesti zad", subtitle: "Podle potíží", href: "/terapie/bolesti-zad", icon: Activity },
    { title: "Krční páteř", subtitle: "Podle potíží", href: "/terapie/krcni-pater", icon: StretchVertical },
    { title: "Rameno", subtitle: "Podle potíží", href: "/terapie/rameno", icon: Move },
    { title: "Koleno", subtitle: "Podle potíží", href: "/terapie/koleno", icon: Bone },
    { title: "Prevence", subtitle: "Podle cíle", href: "/terapie/prevence", icon: ShieldCheck },
  ]
  return (
    <div className="min-w-[720px] w-[min(92vw,780px)] p-0">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
        {/* Left list */}
        <div className="p-0">
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.title}>
                <Link
                  href={it.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 hover:bg-emerald-50/60 hover:shadow-sm"
                >
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-emerald-100 ring-1 ring-emerald-200 text-emerald-700">
                    <it.icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-emerald-900 leading-tight">{it.title}</span>
                    <span className="block text-xs text-emerald-700/70">{it.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Right rail */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 rounded-xl">
          <div className="space-y-3">
            <div aria-hidden className="w-full h-28 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Stethoscope className="w-12 h-12 text-emerald-600" />
            </div>
            <h4 className="text-base font-semibold text-emerald-900">Nevíš kde začít?</h4>
            <p className="text-sm text-emerald-700/80">Krátký test ti doporučí nejvhodnější postup podle potíží.</p>
            <Button variant="secondary" size="sm" asChild className="focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
              <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Premium Pro terapeuty list-only dropdown (narrow)
function ProTerapeutyMenuContent() {
  const items = [
    { title: "Přidat profil", subtitle: "Začni přijímat nové klienty", href: "/pro-terapeuty/pridat-profil", icon: UserPlus },
    { title: "Ceník", subtitle: "Transparentní podmínky", href: "/pro-terapeuty/cenik", icon: DollarSign },
    { title: "FAQ", subtitle: "Často kladené otázky", href: "/pro-terapeuty/faq", icon: HelpCircle },
  ]
  return (
    <div className="min-w-[480px] w-[min(92vw,600px)] p-0">
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.title}>
            <Link
              href={it.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 hover:bg-emerald-50/60 hover:shadow-sm"
            >
              <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-emerald-100 ring-1 ring-emerald-200 text-emerald-700">
                <it.icon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-emerald-900 leading-tight">{it.title}</span>
                <span className="block text-xs text-emerald-700/70">{it.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Simple navigation items
const navigationItems = [
  { title: "Jak to funguje", href: "/#how" },
  { title: "Terapie", href: "#", hasDropdown: true },
  { title: "Pro pojišťovny", href: "/#insurers" },
  { title: "Pro terapeuty", href: "#", hasDropdown: true },
  { title: "O nás", href: "/#about" },
]

export function Navbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Mock state - will be replaced with real auth
  const pathname = usePathname()
  const isScrolled = useHasScrolled(8)

  // Scroll spy - only use on home page
  const scrollSpyResult = useScrollSpy(["how","steps","benefits","insurers","testimonials","faq","cta"], 100)
  const activeSectionId = pathname === "/" ? scrollSpyResult : ""

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return false
  }

  const isAnchorActive = (hash: string) => {
    if (pathname !== "/") return false
    const clean = hash.replace("/#", "").replace("#", "")
    return activeSectionId === clean
  }

  return (
    <header
      data-scrolled={isScrolled}
      className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl transition data-[scrolled=true]:bg-white/90 data-[scrolled=true]:border-b data-[scrolled=true]:border-emerald-900/5"
    >
      <nav className="max-w-screen-xl mx-auto h-16 px-4 flex items-center justify-between gap-4" role="navigation" aria-label="Hlavní navigace">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-2xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 rounded-sm text-emerald-900 hover:text-emerald-700"
        >
          BIBIA
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex relative">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.title}>
                {item.hasDropdown ? (
                  <>
                    <NavigationMenuTrigger
                      aria-label={item.title}
                      className="rounded-full h-9 px-4 text-emerald-900/80 hover:bg-emerald-50 focus transition-colors data-[state=open]:text-emerald-900 data-[state=open]:bg-emerald-50"
                    >
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-[min(92vw,780px)] p-6 rounded-2xl border border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-2xl">
                      {item.title === "Terapie" ? (
                        <TerapieMenuContent />
                      ) : item.title === "Pro terapeuty" ? (
                        <ProTerapeutyMenuContent />
                      ) : null}
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      aria-label={item.title}
                      aria-current={isActive(item.href) || isAnchorActive(item.href) ? "page" : undefined}
                      className={cn(
                        "rounded-full h-9 px-4 text-emerald-900/80 hover:bg-emerald-50 focus transition-colors",
                        (isActive(item.href) || isAnchorActive(item.href)) && "text-emerald-900 bg-emerald-50"
                      )}
                    >
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="outline" size="sm" className="gap-2 bg-white/70 border-emerald-900/15 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2">
            <Search className="h-4 w-4" />
            <span>Najít péči</span>
            <kbd className="ml-1 hidden lg:inline text-[10px] text-emerald-600/70">⌘K</kbd>
          </Button>
          {isLoggedIn ? (
            <UserDropdown isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-emerald-900/80 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
            >
              <Link href="/login">Přihlásit</Link>
            </Button>
          )}
          <Button asChild className="pill-primary">
            <Link href={ROUTES.questionnaire} aria-current={pathname === ROUTES.questionnaire ? "page" : undefined} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-10 w-10 p-0 text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
              aria-label="Otevřít menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px]">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <button
                type="button"
                className="w-full flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                <Search className="h-4 w-4" />
                <span>Najít péči</span>
                <kbd className="ml-auto text-[10px] text-emerald-500">⌘K</kbd>
              </button>
            </div>
            <nav className="mt-6 space-y-3">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  {item.hasDropdown ? (
                    <details className="group">
                      <summary className="px-3 py-3 text-base font-medium text-emerald-700 cursor-pointer select-none rounded-md hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
                        {item.title}
                      </summary>
                      <div className="ml-2 mt-2 space-y-1">
                        {item.title === "Terapie" ? (
                          THERAPY_CARDS.map((therapy) => (
                            <Link
                              key={therapy.title}
                              href={therapy.href}
                              className="block px-3 py-2 text-sm rounded-md transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                            >
                              {therapy.title}
                            </Link>
                          ))
                        ) : item.title === "Pro terapeuty" ? (
                          [
                            { title: "Přidat profil", href: "/pro-terapeuty/pridat-profil" },
                            { title: "Ceník", href: "/pro-terapeuty/cenik" },
                            { title: "FAQ", href: "/pro-terapeuty/faq" },
                          ].map((subItem) => (
                            <Link
                              key={subItem.title}
                              href={subItem.href}
                              className="block px-3 py-2 text-sm rounded-md transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                            >
                              {subItem.title}
                            </Link>
                          ))
                        ) : null}
                      </div>
                    </details>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-3 py-3 text-base font-medium rounded-md transition-colors hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
                        isActive(item.href) && "text-emerald-700 bg-emerald-50",
                        isAnchorActive(item.href) && "text-emerald-700 bg-emerald-50"
                      )}
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-emerald-200 space-y-2">
                {isLoggedIn ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        console.log("Moje termíny")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      <span>Moje termíny</span>
                    </button>
                    <button
                      onClick={() => {
                        console.log("Oblíbení terapeuti")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      <span>Oblíbení terapeuti</span>
                    </button>
                    <button
                      onClick={() => {
                        console.log("Nastavení")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-900 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      <span>Nastavení</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsLoggedIn(false)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <span>Odhlásit</span>
                    </button>
                  </div>
        ) : (
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-emerald-900/80 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/login">Přihlásit</Link>
                  </Button>
                )}
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
                  <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">Spustit test</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}