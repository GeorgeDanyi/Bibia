"use client"

import * as React from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import type { TherapistService } from "@/app/results/ResultsPageSplit"

interface ProposedTermPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (dateTime: Date) => void
  selectedService: TherapistService | null
  currentSlots: number
  maxSlots?: number
}

export function ProposedTermPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedService,
  currentSlots,
  maxSlots = 3,
}: ProposedTermPickerDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null)

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedDate(undefined)
      setSelectedSlot(null)
    }
  }, [open])

  // Generate time slots for selected date
  const timeSlots = React.useMemo(() => {
    if (!selectedDate || !selectedService) {
      return []
    }

    const slots: Array<{ start: string; end: string; disabled: boolean }> = []
    const today = new Date()
    const isToday = 
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()

    const durationMin = selectedService.durationMin || 60
    const slotStep = 15 // 15 minute steps (like Zaptime)
    const startHour = 7
    const endHour = 20

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotStep) {
        // Limit to ~30 slots
        if (slots.length >= 30) {
          break
        }

        const startTime = new Date(selectedDate)
        startTime.setHours(hour, minute, 0, 0)

        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + durationMin)

        // Check if slot would go past endHour
        if (endTime.getHours() > endHour || (endTime.getHours() === endHour && endTime.getMinutes() > 0)) {
          continue
        }

        // Disable if in the past (only for today)
        const isDisabled = isToday && startTime < today

        const startStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`

        slots.push({
          start: startStr,
          end: endStr,
          disabled: isDisabled,
        })
      }
      if (slots.length >= 30) {
        break
      }
    }

    return slots
  }, [selectedDate, selectedService])

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) {
      return
    }

    const [hours, minutes] = selectedSlot.split(':').map(Number)
    const dateTime = new Date(selectedDate)
    dateTime.setHours(hours, minutes, 0, 0)

    // Validate: not in the past
    if (dateTime < new Date()) {
      return
    }

    onConfirm(dateTime)
    onOpenChange(false)
  }

  const isConfirmDisabled = !selectedDate || !selectedSlot || currentSlots >= maxSlots

  // Format date in Czech: "pondělí, 2. února 2026"
  const formattedDate = selectedDate
    ? format(selectedDate, "EEEE, d. MMMM yyyy", { locale: cs })
    : null

  // Disable past dates
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateOnly < todayOnly
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] p-0 overflow-hidden rounded-2xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Calendar */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Vybrat termín</h2>
              <p className="text-sm text-gray-600">Vyberte datum a čas pro konzultaci</p>
            </div>
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="w-full"
            />
          </div>

          {/* Right: Time slots */}
          <div className="p-6 flex flex-col bg-white">
            {selectedDate ? (
              <>
                {/* Header with formatted date */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {formattedDate}
                  </h3>
                  <p className="text-sm text-gray-600">Vyberte čas</p>
                </div>

                {/* Scrollable time slots */}
                <ScrollArea className="h-[420px] pr-4">
                  <div className="space-y-3">
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot, index) => {
                        const isSelected = selectedSlot === slot.start

                        return (
                          <Button
                            key={index}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            disabled={slot.disabled}
                            onClick={() => !slot.disabled && setSelectedSlot(slot.start)}
                            className={`
                              w-full justify-start text-left font-normal
                              rounded-xl py-5 text-lg
                              ${isSelected 
                                ? "bg-gray-900 text-white hover:bg-gray-800" 
                                : "hover:bg-gray-50"
                              }
                              ${slot.disabled ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                          >
                            {slot.start} – {slot.end}
                          </Button>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">
                        Žádné dostupné časy pro tento den
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer with actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium px-5"
                  >
                    Zrušit
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold px-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                  >
                    Přidat termín
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500 text-center">
                  Vyberte prosím datum v kalendáři
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

