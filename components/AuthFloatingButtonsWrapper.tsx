"use client"

import { usePathname } from "next/navigation"
import { AuthFloatingButtons } from "./site/AuthFloatingButtons"
import { useState } from "react"

export default function AuthFloatingButtonsWrapper() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Mock state - will be replaced with real auth
  
  // Hide floating buttons for questionnaire, results, and therapist detail routes
  if (pathname?.startsWith('/questionnaire') || pathname?.startsWith('/results') || pathname?.startsWith('/therapists/')) {
    return null
  }
  
  return (
    <AuthFloatingButtons 
      isLoggedIn={isLoggedIn} 
      onLogout={() => setIsLoggedIn(false)}
    />
  )
}

