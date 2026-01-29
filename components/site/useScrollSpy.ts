"use client"

import { useEffect, useState, useRef } from "react"

export function useScrollSpy(ids: string[], offset: number = 0): string {
  const [activeId, setActiveId] = useState<string>("")
  const activeIdRef = useRef<string>("")

  useEffect(() => {
    if (typeof window === "undefined" || !ids || ids.length === 0) return

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find all intersecting entries and pick the one closest to the top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute("id") || ""
          if (id && id !== activeIdRef.current) {
            activeIdRef.current = id
            setActiveId(id)
          }
          return
        }

        // Fallback: find the section that just passed the threshold
        const nearTop = entries
          .slice()
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))
        const id = nearTop[0]?.target.getAttribute("id") || ""
        if (id && id !== activeIdRef.current) {
          activeIdRef.current = id
          setActiveId(id)
        }
      },
      {
        // Trigger a bit before section top enters viewport
        root: null,
        rootMargin: `${-offset}px 0px -70% 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [ids, offset])

  return activeId
}


