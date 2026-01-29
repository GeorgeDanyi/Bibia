"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type CommandContextType = {
  query: string
  setQuery: (v: string) => void
}

const CommandContext = React.createContext<CommandContextType | null>(null)

function useCommand() {
  const ctx = React.useContext(CommandContext)
  if (!ctx) throw new Error("Command components must be used within <Command>")
  return ctx
}

export function Command({ className, children }: { className?: string; children: React.ReactNode }) {
  const [query, setQuery] = React.useState("")
  return (
    <CommandContext.Provider value={{ query, setQuery }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </CommandContext.Provider>
  )
}

export function CommandInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { setQuery } = useCommand()
  return (
    <input
      {...props}
      className={cn(
        "flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm",
        props.className
      )}
      onChange={(e) => {
        props.onChange?.(e)
        setQuery(e.target.value)
      }}
    />
  )
}

export function CommandList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-2", className)}>{children}</div>
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  const { query } = useCommand()
  // Consumers should conditionally render based on filtered results. Here we just expose.
  return <div data-command-empty>{children}</div>
}

export function CommandGroup({ heading, children }: { heading?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="group" className="px-2 py-2">
      {heading ? <div className="px-2 pb-1 text-xs text-muted-foreground">{heading}</div> : null}
      <div className="grid">
        {children}
      </div>
    </div>
  )
}

export function CommandSeparator() {
  return <div className="my-2 h-px bg-border" />
}

export function CommandItem({
  children,
  onSelect,
  value,
  className,
}: {
  children: React.ReactNode
  onSelect?: (value: string) => void
  value?: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        "text-left rounded-md px-2 py-2 text-sm hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
      onClick={() => onSelect?.(value || "")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          onSelect?.(value || "")
        }
      }}
    >
      {children}
    </button>
  )
}
