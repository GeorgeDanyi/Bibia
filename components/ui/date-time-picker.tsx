'use client'

import React, { useState } from 'react'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'

/**
 * Simple Date-Time Picker Component
 * For selecting date and time for consultation slot proposals
 */
export function DateTimePicker({
  value,
  onChange,
  onConfirm,
  maxSlots = 3,
  currentSlots = 0,
}: {
  value: Date | null
  onChange: (date: Date | null) => void
  onConfirm: () => void
  maxSlots?: number
  currentSlots?: number
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value)
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [isOpen, setIsOpen] = useState(false)

  // Generate time slots (every 30 minutes from 07:00 to 20:00)
  const timeSlots: string[] = []
  for (let hour = 7; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(timeStr)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const handleConfirm = () => {
    if (selectedDate && currentSlots < maxSlots) {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const combinedDate = new Date(selectedDate)
      combinedDate.setHours(hours, minutes, 0, 0)
      
      // Validate: not in the past
      if (combinedDate < new Date()) {
        alert('Nelze vybrat termín v minulosti')
        return
      }

      onChange(combinedDate)
      setIsOpen(false)
      onConfirm()
    }
  }

  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'PPP', { locale: cs }) : 'Vyberte datum'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Simple date input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Datum</label>
            <input
              type="date"
              min={minDate.toISOString().split('T')[0]}
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Time picker */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Čas
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleConfirm}
              size="sm"
              className="flex-1"
              disabled={!selectedDate || currentSlots >= maxSlots}
            >
              Přidat
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

