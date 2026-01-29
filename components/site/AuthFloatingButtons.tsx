"use client"

import { useRouter } from "next/navigation"
import { UserDropdown } from "./UserDropdown"
import { User, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFloatingButtonsProps {
  isLoggedIn?: boolean
  userType?: "client" | "therapist"
  onLogout?: () => void
}

export function AuthFloatingButtons({ 
  isLoggedIn = false, 
  userType = "client",
  onLogout 
}: AuthFloatingButtonsProps) {
  const router = useRouter()

  // Pokud je uživatel přihlášený, zobraz pouze UserDropdown s floating stylem
  if (isLoggedIn) {
    return (
      <div className="fixed top-20 right-4 z-50 pointer-events-auto">
        <div className={cn(
          "flex items-center gap-2 rounded-full px-3 py-2.5",
          "bg-white/95 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
          "border border-slate-200/60",
          "hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition-all duration-200"
        )}>
          <UserDropdown isLoggedIn={isLoggedIn} onLogout={onLogout} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
        {/* Client auth button */}
        <button
          onClick={() => router.push("/login")}
          className={cn(
            "group flex items-center gap-2 rounded-full px-3 py-2.5",
            "bg-white/95 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            "border border-slate-200/60",
            "text-slate-700 hover:text-slate-900",
            "hover:bg-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
          )}
          aria-label="Přihlásit se jako klient"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-medium pr-1 hidden sm:inline">
            Přihlásit
          </span>
        </button>

        {/* Therapist auth button */}
        <button
          onClick={() => router.push("/login")}
          className={cn(
            "group flex items-center gap-2 rounded-full px-3 py-2.5",
            "bg-white/95 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            "border border-slate-200/60",
            "text-slate-700 hover:text-slate-900",
            "hover:bg-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
          )}
          aria-label="Přihlásit se jako terapeut"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Stethoscope className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-medium pr-1 hidden sm:inline">
            Pro terapeuty
          </span>
        </button>
      </div>
    </>
  )
}

