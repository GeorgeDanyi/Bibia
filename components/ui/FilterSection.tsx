"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"

export interface FilterSectionProps {
  title: string
  children: React.ReactNode
  isExpanded?: boolean
  onToggle?: () => void
  className?: string
  collapsible?: boolean
}

export function FilterSection({ 
  title, 
  children, 
  isExpanded = true, 
  onToggle, 
  className,
  collapsible = false 
}: FilterSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div 
        className={cn(
          "flex items-center justify-between",
          collapsible && "cursor-pointer"
        )}
        onClick={collapsible ? onToggle : undefined}
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {collapsible && (
          <button
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}

export default FilterSection


