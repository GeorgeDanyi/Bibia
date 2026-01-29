"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { cs } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  availableDays?: Date[] // Days with available slots
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  availableDays,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Get first day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = monthStart.getDay()
  // Convert to Monday = 0 format
  const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  
  // Get all days in month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Create calendar grid (6 weeks = 42 days)
  const calendarDays: (Date | null)[] = []
  
  // Add empty cells for days before month start
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null)
  }
  
  // Add all days in month
  daysInMonth.forEach(day => {
    calendarDays.push(day)
  })
  
  // Fill remaining cells to complete 6 weeks
  const remainingDays = 42 - calendarDays.length
  for (let i = 0; i < remainingDays; i++) {
    calendarDays.push(null)
  }

  const dayNames = ['po', 'út', 'st', 'čt', 'pá', 'so', 'ne']

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const today = new Date()
  
  // Check if date has available slots
  const hasAvailability = (date: Date) => {
    if (!availableDays || availableDays.length === 0) return true // If no data, assume available
    return availableDays.some(availableDate => 
      availableDate.getDate() === date.getDate() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getFullYear() === date.getFullYear()
    )
  }
  
  const isDateDisabled = (date: Date) => {
    if (disabled) {
      return disabled(date)
    }
    // Default: disable past dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (dateOnly < todayOnly) return true
    
    // Disable dates without availability
    if (availableDays && availableDays.length > 0) {
      return !hasAvailability(date)
    }
    
    return false
  }

  return (
    <div className={cn("bg-white", className)}>
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "LLLL yyyy", { locale: cs })}
        </h3>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:shadow-sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:shadow-sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-3 px-1">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide h-8 flex items-center justify-center"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-10" />
          }

          const isSelected = selected && isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          const isDisabled = isDateDisabled(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const hasSlots = hasAvailability(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !isDisabled && onSelect?.(day)}
              disabled={isDisabled}
              className={cn(
                "h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 relative",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400",
                isSelected && "bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md",
                !isSelected && !isDisabled && isCurrentMonth && "text-gray-900 hover:bg-gray-100 hover:shadow-sm",
                !isSelected && !isDisabled && !isCurrentMonth && "text-gray-400 hover:bg-gray-50",
                isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent",
                isToday && !isSelected && "ring-2 ring-gray-300 ring-offset-1"
              )}
            >
              {format(day, "d")}
              {/* Availability indicator dot */}
              {!isSelected && !isDisabled && hasSlots && availableDays && availableDays.length > 0 && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

