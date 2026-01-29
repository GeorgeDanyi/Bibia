"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserDropdown } from "@/components/site/UserDropdown";
import { User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const centerLinks = [
  { label: "Jak to funguje", href: "#jak-to-funguje" },
  { label: "Výhody", href: "#vyhody" },
  { label: "Ceník", href: "#cenik" },
  { label: "Kontakt", href: "#kontakt" },
  { label: "FAQ", href: "#faq" },
];

export default function NavbarBubble() {
  const [scrolled, setScrolled] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock state - will be replaced with real auth

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 6);
      setShowCta(scrollY >= 100);
    };
    
    // Defer initial scroll check until after React has finished hydrating
    // This prevents hydration mismatch errors by ensuring the initial render
    // matches the server-rendered HTML
    requestAnimationFrame(() => {
      onScroll();
    });
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-5 z-50">
      <div className="relative mx-auto max-w-6xl px-3 sm:px-4">
        {/* center bubble nav - absolutně vycentrovaný */}
        <nav
          className={cn(
            "pointer-events-auto absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 rounded-full px-1.5 sm:px-2",
            "bg-white/90 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5",
            scrolled ? "py-1.5" : "py-2"
          )}
          aria-label="Hlavní navigace"
        >
          {/* logo pill */}
          <button
            onClick={() => (window.location.href = "/")}
            className="ml-0.5 mr-0.5 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
            aria-label="BIBIA domů"
          >
            B
          </button>

          {/* links */}
          <ul className="hidden md:flex items-center gap-0.5">
            {centerLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 whitespace-nowrap"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Divider - odděluje klientskou navigaci od účtů/portálů */}
          <div className="hidden md:block h-5 w-px bg-slate-200 mx-0.5" />

          {/* Auth buttons / User dropdown */}
          {isLoggedIn ? (
            <div className="ml-0.5 pointer-events-auto">
              <UserDropdown isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
            </div>
          ) : (
            <>
              {/* Client auth button */}
              <Link
                href="/login"
                className={cn(
                  "navbar-auth-button group flex items-center gap-1 sm:gap-1.5",
                  "px-2 sm:px-3 py-1.5",
                  "text-slate-700 hover:text-slate-900",
                  "hover:bg-slate-100/60",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2",
                  "pointer-events-auto"
                )}
                aria-label="Přihlásit se jako klient"
              >
                <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <User className="h-3 w-3" />
                </div>
                <span className="text-[12px] font-medium pr-0.5 hidden sm:inline whitespace-nowrap">
                  Přihlásit
                </span>
              </Link>

              {/* Therapist auth button - subtilnější */}
              <Link
                href="/login"
                className={cn(
                  "navbar-auth-button group flex items-center gap-1 sm:gap-1.5",
                  "px-2 sm:px-3 py-1.5",
                  "text-slate-500 hover:text-slate-700",
                  "hover:bg-slate-50/60",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2",
                  "pointer-events-auto"
                )}
                aria-label="Jste terapeut? Přihlásit se"
              >
                <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors">
                  <Stethoscope className="h-3 w-3" />
                </div>
                <span className="text-[11px] font-normal pr-0.5 hidden sm:inline whitespace-nowrap">
                  Jste terapeut?
                </span>
              </Link>
            </>
          )}

          {/* mobile menu (simple overflow scroll) */}
          <div className="md:hidden">
            <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar max-w-[52vw] pr-0.5">
              {centerLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-slate-900 hover:bg-slate-100 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* CTA Najít fyzioterapeuta - zobrazí se až po scrollu, hned vedle navbaru vpravo */}
        <div
          className={cn(
            "pointer-events-auto absolute left-1/2 transition-all duration-300 ease-out",
            "translate-x-[calc(50%+250px)] sm:translate-x-[calc(50%+300px)]",
            showCta
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          )}
        >
          <a
            href="#rezervovat"
            className={cn(
              "inline-flex items-center gap-2 rounded-full",
              "bg-gradient-to-r from-emerald-600 to-emerald-500",
              "px-4 py-2.5 sm:px-5 sm:py-3",
              "text-[13px] sm:text-[14px] font-semibold text-white",
              "hover:from-emerald-700 hover:to-emerald-600",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2",
              "shadow-[0_4px_12px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_16px_rgba(34,197,94,0.35)]",
              "whitespace-nowrap",
              "backdrop-blur-sm"
            )}
          >
            <span className="hidden sm:inline">Najít fyzioterapeuta</span>
            <span className="sm:hidden">Najít</span>
          </a>
        </div>
      </div>
    </header>
  );
}