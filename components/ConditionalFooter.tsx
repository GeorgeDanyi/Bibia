"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/components/footer"

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Hide footer for questionnaire, results, therapist detail, and login routes
  if (pathname?.startsWith('/questionnaire') || 
      pathname?.startsWith('/results') || 
      pathname?.startsWith('/therapists/') ||
      pathname === '/login') {
    return null
  }
  
  return <Footer />
}
