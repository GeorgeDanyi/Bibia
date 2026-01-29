/**
 * Availability Calendar Component
 * 
 * Read-only mini calendar showing availability status for current month.
 * Used in therapist profile availability tab.
 * 
 * All text is in Czech as per product requirements.
 */

'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AvailabilityState } from '@/lib/constants/availability-states'

interface DayAvailability {
  date: Date
  state: AvailabilityState
}

interface AvailabilityCalendarProps {
  /**
   * Optional: Array of day availability data
   * If not provided, generates mock data for demonstration
   */
  days?: DayAvailability[]
  className?: string
}

/**
 * Generate mock availability data for a specific month
 * This is a placeholder until real calendar data is available
 */
function generateMockAvailability(year: number, month: number): DayAvailability[] {
  const today = new Date()
  
  // Get first and last day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  const days: DayAvailability[] = []
  
  // Generate availability for each day
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    
    // Skip past dates
    if (date < today) {
      continue
    }
    
    // Mock logic: vary availability based on day
    let state: AvailabilityState
    
    // Weekends are typically limited
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      state = AvailabilityState.LIMITED
    } 
    // Some days are fully booked
    else if (day % 7 === 0 || day % 11 === 0) {
      state = AvailabilityState.FULL
    }
    // Most weekdays are available
    else {
      state = AvailabilityState.AVAILABLE
    }
    
    days.push({ date, state })
  }
  
  return days
}

/**
 * Get day styling based on availability state
 */
function getDayStyle(state: AvailabilityState, isToday: boolean): string {
  const baseStyles = 'w-6 h-6 flex items-center justify-center text-[10px] font-medium rounded transition-colors'
  
  if (isToday) {
    return `${baseStyles} ring-1.5 ring-seafoam-500 ring-offset-0`
  }
  
  switch (state) {
    case AvailabilityState.AVAILABLE:
      return `${baseStyles} bg-green-50 text-green-600 border border-green-100`
    case AvailabilityState.LIMITED:
      return `${baseStyles} bg-amber-50 text-amber-600 border border-amber-100`
    case AvailabilityState.FULL:
      return `${baseStyles} bg-gray-50 text-gray-400 border border-gray-100`
    default:
      return `${baseStyles} bg-gray-50 text-gray-300 border border-gray-100`
  }
}

/**
 * Availability Calendar - Read-only mini calendar
 */
export function AvailabilityCalendar({ 
  days,
  className = '' 
}: AvailabilityCalendarProps) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const [displayMonth, setDisplayMonth] = useState(currentMonth)
  const [displayYear, setDisplayYear] = useState(currentYear)
  
  // Calculate maximum allowed month (current + 2 months)
  const maxMonth = currentMonth + 2
  const maxYear = maxMonth > 11 ? currentYear + 1 : currentYear
  const maxMonthNormalized = maxMonth > 11 ? maxMonth - 12 : maxMonth
  
  // Check if we can navigate
  const canGoPrevious = !(displayMonth === currentMonth && displayYear === currentYear)
  const canGoNext = !(displayMonth === maxMonthNormalized && displayYear === maxYear)
  
  // Use provided days or generate mock data for displayed month
  // If days are provided, filter them for the displayed month
  // Otherwise, generate mock data for the displayed month
  const availabilityDays = days 
    ? days.filter(day => 
        day.date.getMonth() === displayMonth && 
        day.date.getFullYear() === displayYear
      )
    : generateMockAvailability(displayYear, displayMonth)
  
  // Create a map for quick lookup
  const availabilityMap = new Map<string, AvailabilityState>()
  availabilityDays.forEach(day => {
    const key = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
    availabilityMap.set(key, day.state)
  })
  
  // Navigation functions
  const goToPreviousMonth = () => {
    if (!canGoPrevious) return
    
    if (displayMonth === 0) {
      setDisplayMonth(11)
      setDisplayYear(displayYear - 1)
    } else {
      setDisplayMonth(displayMonth - 1)
    }
  }
  
  const goToNextMonth = () => {
    if (!canGoNext) return
    
    if (displayMonth === 11) {
      setDisplayMonth(0)
      setDisplayYear(displayYear + 1)
    } else {
      setDisplayMonth(displayMonth + 1)
    }
  }
  
  // Get first day of month and number of days
  const firstDay = new Date(displayYear, displayMonth, 1)
  const lastDay = new Date(displayYear, displayMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Czech day names (abbreviated)
  const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
  
  // Czech month names
  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ]
  
  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }
  
  return (
    <div className={`${className}`}>
      {/* Month header with navigation */}
      <div className="flex items-center justify-between mb-2.5">
        {canGoPrevious ? (
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Předchozí měsíc"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        ) : (
          <div className="w-6" /> // Spacer to keep title centered
        )}
        <h4 className="text-xs font-semibold text-gray-900">
          {monthNames[displayMonth]} {displayYear}
        </h4>
        {canGoNext ? (
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Další měsíc"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        ) : (
          <div className="w-6" /> // Spacer to keep title centered
        )}
      </div>
      
      {/* Calendar grid - fixed height to prevent card size changes */}
      <div className="space-y-1 h-[120px]">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {dayNames.map((dayName, idx) => (
            <div
              key={idx}
              className="text-center text-[9px] font-medium text-gray-500 w-6 h-6 flex items-center justify-center"
            >
              {dayName}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="w-6 h-6" />
            }
            
            const date = new Date(displayYear, displayMonth, day)
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
            const state = availabilityMap.get(dateKey) || AvailabilityState.FULL
            const isToday = 
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()
            const isPast = date < today && !isToday
            
            return (
              <div
                key={idx}
                className={`
                  ${getDayStyle(state, isToday)}
                  ${isPast ? 'opacity-40' : ''}
                `}
                title={`${day}. ${monthNames[displayMonth]} - ${
                  state === AvailabilityState.AVAILABLE ? 'Volné' :
                  state === AvailabilityState.LIMITED ? 'Na dotaz' :
                  'Obsazeno'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AvailabilityCalendar

