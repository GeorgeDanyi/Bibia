"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Laptop } from "lucide-react"

export interface FilterChipProps {
  label: string
  value: string
  type: 'must-have' | 'prefer' | 'location' | 'time' | 'language' | 'experience' | 'online'
  onRemove: (value: string) => void
  className?: string
}

const typeStyles = {
  'must-have': {
    base: 'bg-seafoam-600 border-seafoam-600 text-white',
    icon: 'text-white'
  },
  'prefer': {
    base: 'bg-transparent border-seafoam-300 text-seafoam-700',
    icon: 'text-seafoam-600'
  },
  'location': {
    base: 'bg-seafoam-100 border-seafoam-200 text-seafoam-800',
    icon: 'text-seafoam-600'
  },
  'time': {
    base: 'bg-transparent border-seafoam-300 text-seafoam-700',
    icon: 'text-seafoam-600'
  },
  'language': {
    base: 'bg-transparent border-seafoam-300 text-seafoam-700',
    icon: 'text-seafoam-600'
  },
  'experience': {
    base: 'bg-transparent border-seafoam-300 text-seafoam-700',
    icon: 'text-seafoam-600'
  },
  'online': {
    base: 'bg-blue-100 border-blue-200 text-blue-800',
    icon: 'text-blue-600'
  }
}

export function FilterChip({ label, value, type, onRemove, className }: FilterChipProps) {
  const styles = typeStyles[type]
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 hover:shadow-sm",
        styles.base,
        className
      )}
    >
      <span className="flex items-center gap-1">
        {type === 'must-have' && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-label="Must have" />
        )}
        {type === 'prefer' && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-label="Prefer" />
        )}
        {type === 'online' && (
          <Laptop className="w-3 h-3" aria-label="Online" />
        )}
        <span>{label}</span>
      </span>
      <button
        onClick={() => onRemove(value)}
        className={cn(
          "ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors",
          styles.icon
        )}
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export default FilterChip
