"use client"

import { useState, useEffect } from "react"

export function useHasScrolled(threshold: number = 4): boolean {
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > threshold)
    }

    // Defer initial scroll check until after React has finished hydrating
    // This prevents hydration mismatch errors by ensuring the initial render
    // matches the server-rendered HTML
    requestAnimationFrame(() => {
      handleScroll()
    })

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return hasScrolled
}
