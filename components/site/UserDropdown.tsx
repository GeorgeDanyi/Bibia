"use client"

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { User, Calendar, Heart, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserDropdownProps {
  isLoggedIn: boolean
  onLogout?: () => void
}

export function UserDropdown({ isLoggedIn, onLogout }: UserDropdownProps) {
  if (!isLoggedIn) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
          aria-label="Můj účet"
        >
          <User className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1 rounded-xl border-emerald-900/10 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="space-y-1">
          <button
            onClick={() => {
              // Placeholder navigation
              console.log("Moje termíny")
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-900 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>Moje termíny</span>
          </button>
          <button
            onClick={() => {
              // Placeholder navigation
              console.log("Oblíbení terapeuti")
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-900 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <Heart className="h-4 w-4 text-emerald-600" />
            <span>Oblíbení terapeuti</span>
          </button>
          <button
            onClick={() => {
              // Placeholder navigation
              console.log("Nastavení")
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-emerald-900 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <Settings className="h-4 w-4 text-emerald-600" />
            <span>Nastavení</span>
          </button>
          <div className="my-1 h-px bg-emerald-900/10" />
          <button
            onClick={() => {
              if (onLogout) onLogout()
              console.log("Odhlásit")
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Odhlásit</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

