"use client"

import { motion, useInView } from "framer-motion"
import { useRef, ReactNode } from "react"

interface FadeInWhenVisibleProps {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
}

export function FadeInWhenVisible({
  children,
  delay = 0,
  direction = "up",
  className
}: FadeInWhenVisibleProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" })

  const getInitial = () => {
    switch (direction) {
      case "up": return { opacity: 0, y: 8 }
      case "down": return { opacity: 0, y: -8 }
      case "left": return { opacity: 0, x: -8 }
      case "right": return { opacity: 0, x: 8 }
      default: return { opacity: 0 }
    }
  }

  const getAnimate = () => {
    switch (direction) {
      case "up":
      case "down": return { opacity: 1, y: 0 }
      case "left":
      case "right": return { opacity: 1, x: 0 }
      default: return { opacity: 1 }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={isInView ? getAnimate() : getInitial()}
      transition={{
        duration: 0.3,
        delay: delay,
        ease: [0.22, 1, 0.36, 1],
        when: "beforeChildren",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}