"use client"
import { ROUTES } from "@/src/config/routes"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function StickyCta() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if the bar was dismissed in this session
    const wasDismissed = sessionStorage.getItem('sticky-cta-dismissed')
    if (!wasDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // Remember dismissal for this session only
    sessionStorage.setItem('sticky-cta-dismissed', 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t border-gray-200 rounded-t-2xl shadow-lg px-4 py-3 pb-safe">
        <div className="flex items-center justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Začni krátkým testem
            </p>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 flex-shrink-0"
          >
            <Link href={ROUTES.questionnaire} aria-label="Spustit dotazník a najít fyzioterapeuta">
              Spustit test
            </Link>
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-1 h-8 w-8 flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Zavřít"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
