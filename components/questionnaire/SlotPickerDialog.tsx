"use client"

import * as React from "react"
import { format } from "date-fns"
import { cs } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TherapistService } from "@/app/results/ResultsPageSplit"
import type { AvailableSlot } from "@/lib/types/booking"

interface SlotPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (slot: AvailableSlot) => void
  therapistId: string
  selectedService: TherapistService | null
  form?: 'online' | 'in_person'
}

export function SlotPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  therapistId,
  selectedService,
  form,
}: SlotPickerDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(null)
  const [availableSlots, setAvailableSlots] = React.useState<AvailableSlot[]>([])
  const [allSlots, setAllSlots] = React.useState<AvailableSlot[]>([]) // All slots for current month
  const [availableDays, setAvailableDays] = React.useState<Date[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const slotsScrollRef = React.useRef<HTMLDivElement>(null)

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedDate(undefined)
      setSelectedSlot(null)
      setAvailableSlots([])
      setError(null)
    }
  }, [open])

  // Load all slots for current month when dialog opens
  React.useEffect(() => {
    if (open && selectedService) {
      loadAllSlots()
    }
  }, [open, selectedService, form])

  // Load slots for selected date
  React.useEffect(() => {
    if (open && selectedDate && selectedService) {
      loadSlots()
    }
  }, [open, selectedDate, selectedService, form])

  // Load all slots for current month (for calendar availability)
  const loadAllSlots = async () => {
    if (!selectedService) return

    try {
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      const to = new Date()
      to.setDate(to.getDate() + 30) // Next 30 days

      const params = new URLSearchParams({
        serviceId: selectedService.id,
        from: from.toISOString(),
        to: to.toISOString(),
      })
      if (form) {
        params.append('form', form)
      }

      const response = await fetch(`/api/therapists/${therapistId}/slots?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load slots')
      }

      const data = await response.json()
      setAllSlots(data.slots)
      
      // Extract unique dates with availability
      const uniqueDates = new Set<string>()
      data.slots.forEach((slot: AvailableSlot) => {
        const slotDate = new Date(slot.startsAt)
        const dateKey = `${slotDate.getFullYear()}-${slotDate.getMonth()}-${slotDate.getDate()}`
        uniqueDates.add(dateKey)
      })
      
      const dates = Array.from(uniqueDates).map(key => {
        const [year, month, day] = key.split('-').map(Number)
        return new Date(year, month, day)
      })
      setAvailableDays(dates)
    } catch (err: any) {
      console.error('Failed to load all slots:', err)
    }
  }

  const loadSlots = async () => {
    if (!selectedDate || !selectedService) return

    setLoading(true)
    setError(null)

    try {
      // Filter from allSlots for selected date
      const daySlots = allSlots.filter((slot: AvailableSlot) => {
        const slotDate = new Date(slot.startsAt)
        return (
          slotDate.getDate() === selectedDate.getDate() &&
          slotDate.getMonth() === selectedDate.getMonth() &&
          slotDate.getFullYear() === selectedDate.getFullYear()
        )
      })
      setAvailableSlots(daySlots)
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst dostupné termíny')
    } finally {
      setLoading(false)
    }
  }

  // Quick filter handlers
  const scrollToTime = (targetHour: number) => {
    if (!slotsScrollRef.current) return
    
    const slotElements = slotsScrollRef.current.querySelectorAll('[data-slot-time]')
    for (const element of Array.from(slotElements) as HTMLElement[]) {
      const hour = parseInt(element.getAttribute('data-slot-time') || '0')
      if (hour >= targetHour) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
        break
      }
    }
  }

  const handleConfirm = () => {
    if (!selectedSlot) {
      return
    }
    onConfirm(selectedSlot)
    onOpenChange(false)
  }

  const isConfirmDisabled = !selectedDate || !selectedSlot

  // Format date in Czech: "čtvrtek, 15. ledna 2026"
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

  // Format time slot
  const formatSlotTime = (slot: AvailableSlot) => {
    const start = new Date(slot.startsAt)
    const end = new Date(slot.endsAt)
    return `${start.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', hour12: false })} – ${end.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] p-0 overflow-hidden rounded-2xl bg-white max-h-[90vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[600px]">
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
              availableDays={availableDays}
              className="w-full"
            />
          </div>

          {/* Right: Time slots */}
          <div className="p-0 flex flex-col bg-white min-h-0">
            {selectedDate ? (
              <>
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {formattedDate}
                  </h3>
                  <p className="text-sm text-gray-600">Vyberte čas</p>
                  
                  {/* Quick Filters */}
                  {availableSlots.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToTime(7)}
                        className="h-7 px-3 text-xs rounded-full border border-gray-200 hover:bg-gray-50"
                      >
                        Ráno
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToTime(12)}
                        className="h-7 px-3 text-xs rounded-full border border-gray-200 hover:bg-gray-50"
                      >
                        Odpoledne
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollToTime(17)}
                        className="h-7 px-3 text-xs rounded-full border border-gray-200 hover:bg-gray-50"
                      >
                        Večer
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scrollable time slots */}
                {loading ? (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-sm text-gray-500">Načítání dostupných termínů...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 px-6 py-4">
                    <div ref={slotsScrollRef} className="space-y-2">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((slot, index) => {
                          const isSelected = selectedSlot?.startsAt === slot.startsAt
                          const start = new Date(slot.startsAt)
                          const hour = start.getHours()

                          return (
                            <Button
                              key={index}
                              type="button"
                              data-slot-time={hour}
                              variant="outline"
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "w-full justify-between text-left font-normal rounded-xl py-4 px-4 h-auto",
                                "border border-gray-200/60 hover:bg-gray-50 transition-all duration-200",
                                isSelected && "bg-gray-900 text-white border-gray-900 shadow-sm hover:bg-gray-800"
                              )}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-base font-medium">
                                  {formatSlotTime(slot)}
                                </span>
                                <span className={cn(
                                  "text-xs mt-0.5",
                                  isSelected ? "text-white/80" : "text-gray-500"
                                )}>
                                  {slot.durationMin} min
                                </span>
                              </div>
                              {isSelected && (
                                <Check className="w-5 h-5 flex-shrink-0" />
                              )}
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
                )}

                {/* Sticky Footer */}
                <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
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
                    Vybrat termín
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1">
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

