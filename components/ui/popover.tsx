"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextType | null>(null)

function usePopover() {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error("Popover components must be used within <Popover>")
  return ctx
}

export function Popover({ 
  children,
  open: controlledOpen,
  onOpenChange
}: { 
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative" ref={containerRef}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ 
  children, 
  className,
  asChild
}: { 
  children: React.ReactNode
  className?: string
  asChild?: boolean
}) {
  const { open, setOpen } = usePopover()
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setOpen(!open)
        if (children.props.onClick) {
          children.props.onClick(e)
        }
      },
    })
  }
  
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(className)}
    >
      {children}
    </button>
  )
}

export function PopoverContent({ 
  children, 
  className,
  align = "start"
}: { 
  children: React.ReactNode
  className?: string
  align?: "start" | "end" | "center"
}) {
  const { open, setOpen } = usePopover()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number | string>('100%')
  
  React.useEffect(() => {
    if (open && contentRef.current) {
      // Find trigger element to get its width
      const container = contentRef.current.closest('[class*="relative"]')
      if (container) {
        const trigger = container.querySelector('button')
        if (trigger) {
          setTriggerWidth(trigger.offsetWidth)
        }
      }
    }
  }, [open])
  
  if (!open) return null
  
  const alignClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2"
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "absolute z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg",
          alignClasses[align],
          className
        )}
        style={{ width: typeof triggerWidth === 'number' ? `${triggerWidth}px` : triggerWidth, minWidth: '200px', maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

