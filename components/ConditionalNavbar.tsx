"use client"

import { usePathname } from "next/navigation"
import NavbarBubble from "@/components/navbar"

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide navbar for questionnaire, results, therapist detail, and login routes
  if (pathname?.startsWith('/questionnaire') || pathname?.startsWith('/results') || pathname?.startsWith('/therapists/') || pathname === '/login') {
    return null
  }
  
  return <NavbarBubble />
}
