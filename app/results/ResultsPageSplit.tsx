/**
 * Results Page - Modern SaaS Layout
 * 
 * Responsive grid layout:
 * - >= lg: 3 sloupce (seznam, detail, CTA)
 * - md: 2 sloupce (seznam, detail + CTA)
 * - sm: 1 sloupec (horizontální pills nahoře, detail, sticky CTA bottom)
 */

'use client'

/* eslint react-hooks/rules-of-hooks: "off" */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getAnswers } from '@/lib/utils/answers'
import type { Answers } from '@/lib/types/answers'
import { pickTopReasonsCs } from '@/lib/matching/reasonCopy'
import { haversineKm } from '@/lib/utils/haversine'
import { cn } from '@/lib/utils'
import { Sparkles, CheckCircle2, MapPin, Calendar, CreditCard, Clock, Globe, Building2, Home, Video, ArrowRight, User, Target, Heart, FileText, Star, Shield, MessageCircle, ChevronDown, ChevronRight, CheckCircle, Verified, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { SlotPickerDialog } from '@/components/questionnaire/SlotPickerDialog'
import type { AvailableSlot } from '@/lib/types/booking'

// Utility funkce pro formátování datumu
function formatSlotDate(slot: AvailableSlot): string {
  const date = new Date(slot.startsAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffDays = Math.floor((slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  const timeStr = date.toLocaleTimeString('cs-CZ', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  
  if (diffDays === 0) {
    return `Dnes ${timeStr}`
  } else if (diffDays === 1) {
    return `Zítra ${timeStr}`
  } else {
    const weekdayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
    const weekday = weekdayNames[date.getDay()]
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${weekday} ${day}. ${month}. · ${timeStr}`
  }
}

function formatSlotDateFull(slot: AvailableSlot): string {
  const date = new Date(slot.startsAt)
  const weekdayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
  const weekday = weekdayNames[date.getDay()]
  const day = date.getDate()
  const month = date.getMonth() + 1
  const timeStr = date.toLocaleTimeString('cs-CZ', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  return `${weekday} ${day}. ${month}. · ${timeStr}`
}

// TherapistService type
export interface TherapistService {
  id: string
  name: string
  description?: string
  durationMin: number
  priceCzk?: number
  priceFromCzk?: number
  modality: 'online' | 'in_person' | 'both'
  tags?: string[]
}

interface Therapist {
  id: string
  name?: string
  fullName?: string
  city?: string
  match_score?: number
  specialties?: string[]
  modalities?: string[]
  reasons?: any[]
  matchReasons?: any[]
  languages?: string[]
  price?: number | string
  pricing?: number | string
  availability?: {
    state?: string
  }
  services?: TherapistService[]
  // Booking provider integration
  bookingProvider?: 'none' | 'zaptime' | 'reservanto'
  bookingUrl?: string
  bookingMode?: 'redirect' | 'iframe'  // default "iframe"
  // ... další properties
}

interface SearchResult {
  results: Therapist[]
}

// Design tokens - jednotné hodnoty pro konzistentní SaaS design
const DESIGN_TOKENS = {
  radius: {
    card: 'rounded-xl',      // Pro všechny karty a panely
    small: 'rounded-lg',     // Pro malé elementy (badges, avatary)
  },
  shadow: {
    card: 'shadow-sm',       // Základní shadow pro karty/panely
    cardHover: 'shadow-md',  // Shadow při hover
  },
  border: {
    hairline: 'border border-gray-200/40',  // Hairline border pro karty
    hairlineHover: 'border-gray-300/50',    // Border při hover
  },
  shadowStyle: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
    cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  }
} as const

/**
 * Mapování specializací z angličtiny do češtiny
 * Podporuje různé formáty: snake_case, Title Case, camelCase
 */
const SPECIALIZATION_TRANSLATIONS: Record<string, string> = {
  // Obecná fyzioterapie
  'General Physiotherapy': 'Obecná fyzioterapie',
  'General': 'Obecná fyzioterapie',
  'general_physiotherapy': 'Obecná fyzioterapie',
  'general_physio': 'Obecná fyzioterapie',
  'general': 'Obecná fyzioterapie',
  
  // Ženské zdraví
  'Women\'s Health': 'Ženské zdraví',
  'Womens Health': 'Ženské zdraví',
  'womens_health': 'Ženské zdraví',
  'women_health': 'Ženské zdraví',
  'womens': 'Ženské zdraví',
  
  // Pánevní dno
  'Pelvic Floor': 'Pánevní dno',
  'Pelvic': 'Pánevní dno',
  'pelvic_floor': 'Pánevní dno',
  'pelvic': 'Pánevní dno',
  
  // Těhotenství a poporodní péče
  'Pregnancy': 'Těhotenství',
  'pregnancy': 'Těhotenství',
  'Postpartum': 'Poporodní péče',
  'postpartum': 'Poporodní péče',
  'Post Partum': 'Poporodní péče',
  'post_partum': 'Poporodní péče',
  
  // Menstruační bolesti
  'Menstrual Pain': 'Menstruační bolesti',
  'menstrual_pain': 'Menstruační bolesti',
  'menstrual': 'Menstruační bolesti',
  
  // Rameno
  'Shoulder': 'Rameno',
  'shoulder': 'Rameno',
  'Shoulders': 'Rameno',
  'shoulders': 'Rameno',
  
  // Bolesti zad/páteře
  'Spine Pain': 'Bolesti zad/páteře',
  'Spine': 'Bolesti zad/páteře',
  'spine_pain': 'Bolesti zad/páteře',
  'spine': 'Bolesti zad/páteře',
  'Back Pain': 'Bolesti zad',
  'back_pain': 'Bolesti zad',
  'back': 'Bolesti zad',
  
  // Koleno
  'Knee': 'Koleno',
  'knee': 'Koleno',
  'Knees': 'Koleno',
  'knees': 'Koleno',
  
  // Pediatrie
  'Pediatrics': 'Pediatrie',
  'Pediatric': 'Pediatrie',
  'pediatrics': 'Pediatrie',
  'pediatric': 'Pediatrie',
  'Children': 'Pediatrie',
  'children': 'Pediatrie',
  'Kids': 'Pediatrie',
  'kids': 'Pediatrie',
  
  // Geriatrie
  'Geriatrics': 'Geriatrie',
  'Geriatric': 'Geriatrie',
  'geriatrics': 'Geriatrie',
  'geriatric': 'Geriatrie',
  'Seniors': 'Geriatrie',
  'seniors': 'Geriatrie',
  'Elderly': 'Geriatrie',
  'elderly': 'Geriatrie',
  
  // Sportovní fyzioterapie
  'Sport': 'Sportovní fyzio',
  'Sports': 'Sportovní fyzio',
  'Sports Physiotherapy': 'Sportovní fyzio',
  'sport': 'Sportovní fyzio',
  'sports': 'Sportovní fyzio',
  'sports_physio': 'Sportovní fyzio',
  'sports_physiotherapy': 'Sportovní fyzio',
  
  // Manuální terapie
  'Manual Therapy': 'Manuální terapie',
  'manual_therapy': 'Manuální terapie',
  'manual': 'Manuální terapie',
  'Manual': 'Manuální terapie',
  
  // Další běžné specializace
  'Neck Pain': 'Bolesti krku',
  'neck_pain': 'Bolesti krku',
  'neck': 'Bolesti krku',
  'Neck': 'Bolesti krku',
  
  'Hip': 'Kyčel',
  'hip': 'Kyčel',
  'Hips': 'Kyčel',
  'hips': 'Kyčel',
  
  'Ankle': 'Kotník',
  'ankle': 'Kotník',
  'Ankles': 'Kotník',
  'ankles': 'Kotník',
  
  'Foot': 'Chodidlo',
  'foot': 'Chodidlo',
  'Feet': 'Chodidlo',
  'feet': 'Chodidlo',
  
  'Elbow': 'Loket',
  'elbow': 'Loket',
  'Elbows': 'Loket',
  'elbows': 'Loket',
  
  'Wrist': 'Zápěstí',
  'wrist': 'Zápěstí',
  'Wrists': 'Zápěstí',
  'wrists': 'Zápěstí',
  
  'Headache': 'Bolesti hlavy',
  'headache': 'Bolesti hlavy',
  'Headaches': 'Bolesti hlavy',
  'headaches': 'Bolesti hlavy',
  
  'TMJ': 'Čelistní kloub',
  'tmj': 'Čelistní kloub',
  'Temporomandibular': 'Čelistní kloub',
  'temporomandibular': 'Čelistní kloub',
  
  'Postural': 'Posturální problémy',
  'postural': 'Posturální problémy',
  'Posture': 'Posturální problémy',
  'posture': 'Posturální problémy',
  
  'Rehabilitation': 'Rehabilitace',
  'rehabilitation': 'Rehabilitace',
  'Rehab': 'Rehabilitace',
  'rehab': 'Rehabilitace',
  
  'Neurological': 'Neurologická fyzioterapie',
  'neurological': 'Neurologická fyzioterapie',
  'Neurology': 'Neurologická fyzioterapie',
  'neurology': 'Neurologická fyzioterapie',
  
  'Cardiac': 'Kardiovaskulární rehabilitace',
  'cardiac': 'Kardiovaskulární rehabilitace',
  'Cardio': 'Kardiovaskulární rehabilitace',
  'cardio': 'Kardiovaskulární rehabilitace',
  
  'Respiratory': 'Respirační fyzioterapie',
  'respiratory': 'Respirační fyzioterapie',
  'Respiratory Therapy': 'Respirační fyzioterapie',
  'respiratory_therapy': 'Respirační fyzioterapie',
  
  'Oncology': 'Onkologická rehabilitace',
  'oncology': 'Onkologická rehabilitace',
  'Cancer Rehabilitation': 'Onkologická rehabilitace',
  'cancer_rehabilitation': 'Onkologická rehabilitace',
}

/**
 * Přeložit specializaci z EN do CZ
 * Podporuje různé formáty: snake_case, Title Case, camelCase
 */
function translateSpecialization(spec: string): string {
  if (!spec || typeof spec !== 'string') {
    return 'Fyzioterapeut'
  }
  
  // Normalizace: trim a odstranění prázdných znaků
  const normalized = spec.trim()
  if (!normalized) {
    return 'Fyzioterapeut'
  }
  
  // Zkus najít přesný match
  if (SPECIALIZATION_TRANSLATIONS[normalized]) {
    return SPECIALIZATION_TRANSLATIONS[normalized]
  }
  
  // Zkus najít case-insensitive match
  const lowerSpec = normalized.toLowerCase()
  for (const [en, cz] of Object.entries(SPECIALIZATION_TRANSLATIONS)) {
    if (en.toLowerCase() === lowerSpec) {
      return cz
    }
  }
  
  // Pokud není překlad, zkus normalizovat snake_case a znovu hledat
  const snakeCase = normalized.replace(/\s+/g, '_').toLowerCase()
  if (SPECIALIZATION_TRANSLATIONS[snakeCase]) {
    return SPECIALIZATION_TRANSLATIONS[snakeCase]
  }
  
  // Pokud stále není překlad, zkus Title Case
  const titleCase = normalized.split(/[\s_]+/).map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ')
  if (SPECIALIZATION_TRANSLATIONS[titleCase]) {
    return SPECIALIZATION_TRANSLATIONS[titleCase]
  }
  
  // Fallback: vrať původní text s capitalizací (snake_case → Title Case)
  return normalized.split(/[\s_]+/).map(w => 
    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' ')
}

// Sjednocený card styl - unified spacing pro SaaS layout
const cardBaseClasses = `bg-white ${DESIGN_TOKENS.radius.card} ${DESIGN_TOKENS.border.hairline} ${DESIGN_TOKENS.shadow.card}`
const cardPaddingClasses = 'p-4'

/**
 * Helper: Formátování nejbližšího termínu s českou gramatikou (zkrácené texty)
 */
function formatNextAvailable(days?: number | null): string {
  if (days === null || days === undefined) {
    return 'Do 24 hodin'
  }
  
  if (days === 0) {
    return 'Dnes'
  }
  
  if (days === 1) {
    return 'Zítra'
  }
  
  if (days >= 2 && days <= 4) {
    return `Za ${days} dny`
  }
  
  return `Za ${days} dní`
}

/**
 * Hlavní komponenta Results Page
 */
export default function ResultsPageSplit() {
  const router = useRouter()
  
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [isBookingPanelHovered, setIsBookingPanelHovered] = useState(false)
  
  const mainPanelScrollRef = useRef<HTMLDivElement>(null)
  const mainPanelScrollContainerRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLDivElement>(null)
  
  const performSearch = useCallback(async (answers: Answers) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/searchTherapists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setResults(data)
      
      // Nemutující sort - vytvoří nové pole pomocí slice()
      const sorted = (data.results || []).slice().sort((a: Therapist, b: Therapist) => {
        const scoreA = a.match_score || 0
        const scoreB = b.match_score || 0
        return scoreB - scoreA
      })
      
      setTherapists(sorted)
      
      if (sorted.length > 0) {
        setSelectedTherapistId(sorted[0].id)
      }
    } catch (err: any) {
      setError(err?.message || 'Nepodařilo se načíst výsledky')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    const answers = getAnswers()
    if (answers) {
      // Zkus získat user coords z answers
      const answersAny = answers as any
      if (answersAny.location?.coords) {
        const coords = answersAny.location.coords
        if (coords.lat && coords.lon && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
          setUserCoords({ lat: coords.lat, lon: coords.lon })
        }
      }
      performSearch(answers)
    } else {
      router.push('/questionnaire')
    }
  }, [performSearch, router])
  
  const handleTherapistSelect = (therapistId: string) => {
    if (therapistId === selectedTherapistId) return
    
    setIsTransitioning(true)
    
    setTimeout(() => {
      setSelectedTherapistId(therapistId)
      // Jemně posuň vnitřní scroll panelu nahoru, aniž by se schoval horní panel stránky
      if (mainPanelScrollContainerRef.current) {
        mainPanelScrollContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
      setTimeout(() => setIsTransitioning(false), 50)
    }, 200)
  }
  
  const selectedTherapist = therapists.find(t => t.id === selectedTherapistId) || null
  const totalResultsCount = results?.results?.length ?? therapists.length
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-seafoam-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">Načítám výsledky…</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              const answers = getAnswers()
              if (answers) performSearch(answers)
            }}
            className="px-4 py-2 bg-seafoam-600 text-white rounded-xl text-sm font-medium"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }
  
  if (therapists.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900 mb-2">Nenašli jsme žádné terapeuty</p>
          <p className="text-sm text-gray-600 mb-4">Zkuste upravit dotazník nebo rozšířit vyhledávání</p>
          <button
            onClick={() => router.push('/questionnaire')}
            className="px-4 py-2 bg-seafoam-600 text-white rounded-xl text-sm font-medium"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-seafoam-50/30 via-white to-seafoam-50/20 flex flex-col relative">
      {/* Dekorativní pozadí - jemné tečky */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle, #225f56 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      {/* Barevné „halo“ prvky pro modernější vibe */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-80 h-80 bg-gradient-radial from-seafoam-300/25 via-seafoam-100/0 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-40px] w-96 h-96 bg-gradient-radial from-seafoam-400/20 via-seafoam-100/0 to-transparent blur-3xl" />
      
      {/* Fixní header */}
      <PageHeader 
        therapistsCount={Math.min(therapists.length, 5)} 
        totalCount={totalResultsCount}
      />
      
      {/* Hlavní obsah - flex layout pro app shell */}
      <div className="flex-1 overflow-hidden relative z-10">
        {/* Mobile: Horizontální scroll pills nahoře */}
        <div className="block sm:hidden border-b border-transparent bg-white/80 backdrop-blur-sm px-4 py-2 shadow-md">
          <TherapistListHorizontal
            therapists={therapists}
            selectedTherapistId={selectedTherapistId}
            onTherapistSelect={handleTherapistSelect}
          />
        </div>
        
        {/* Desktop/Tablet: 3-sloupcový layout s interními scrolly */}
        <div className="h-full max-w-[1600px] mx-auto px-4 py-3 sm:py-4 min-h-0 relative">
          <div className="h-full grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-3 lg:gap-6 min-h-0">
            {/* Levý sloupec - Seznam terapeutů (skrytý na mobile) - PREMIUM MODERNÍ DESIGN */}
            <div className="hidden sm:block md:col-span-12 lg:col-span-3 order-3 md:order-3 lg:order-1 h-full flex flex-col min-h-0 relative z-20">
              <div className="sticky top-4 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] flex flex-col">
                {/* Selection bubble - premium elegantní sidebar */}
                <div
                  className={cn(
                    "bg-white backdrop-blur-2xl rounded-3xl border border-seafoam-200/50 flex flex-col h-full min-h-0 overflow-hidden shadow-[0_2px_8px_rgba(13,148,136,0.06),0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-500 relative",
                    "hover:shadow-[0_4px_12px_rgba(13,148,136,0.08),0_2px_6px_rgba(0,0,0,0.06)] hover:border-seafoam-300/60",
                    isBookingPanelHovered && "opacity-60 blur-[1px]"
                  )}
                >
                  {/* Jemný gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-seafoam-50/15 via-white/50 to-seafoam-50/8 pointer-events-none rounded-3xl" />
                  
                  {/* Header s nadpisem - alternativní elegantní design */}
                  <div className="relative z-10 px-5 pt-4 pb-3 border-b border-gray-100/60 bg-white/95 overflow-hidden">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.02]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(13,148,136)_1px,transparent_0)] [background-size:20px_20px]" />
                    </div>
                    
                    {/* Elegantní levý border accent */}
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-seafoam-400/80 via-seafoam-500 to-seafoam-400/80 rounded-r-full" />
                    
                    <div className="relative flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-seafoam-50 border border-seafoam-200/60 shadow-sm">
                        <User className="w-5 h-5 text-seafoam-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                          Vyberte terapeuta
                        </h2>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seznam terapeutů */}
                  <div className="relative z-10 flex-1 min-h-0 bg-white">
                    <TherapistList
                      therapists={therapists}
                      selectedTherapistId={selectedTherapistId}
                      onTherapistSelect={handleTherapistSelect}
                      userCoords={userCoords}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Střední sloupec - Detail terapeuta (vnitřní scroll) */}
            <div className="col-span-1 md:col-span-12 lg:col-span-6 order-1 md:order-1 lg:order-2 h-full flex flex-col min-h-0">
              <div ref={mainPanelScrollContainerRef} className="h-full overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                <div 
                  ref={mainPanelScrollRef}
                  className={cn(
                    "bg-white/90 backdrop-blur-sm rounded-2xl border border-transparent shadow-[0_18px_45px_rgba(15,23,42,0.16)] p-6 lg:p-8 transition-all duration-300",
                    isTransitioning ? 'opacity-50' : 'opacity-100',
                    isBookingPanelHovered && !isTransitioning && "opacity-60 blur-[1px]"
                  )}
                  style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)' }}
                >
                  {selectedTherapist ? (
                    <TherapistDetailPanel
                      key={selectedTherapist.id}
                      therapist={selectedTherapist}
                      therapistIndex={Math.max(0, therapists.findIndex(t => t.id === selectedTherapist.id))}
                      scrollContainerRef={mainPanelScrollContainerRef}
                      heroSectionRef={heroSectionRef}
                    />
                  ) : (
                    <EmptyDetailState />
                  )}
                </div>
              </div>
            </div>
            
            {/* Pravý sloupec - Smart Booking Widget (sticky) */}
            <div 
              className="col-span-1 md:col-span-12 lg:col-span-3 order-2 md:order-2 lg:order-3 h-full flex flex-col min-h-0 relative z-[60]"
              onMouseEnter={() => setIsBookingPanelHovered(true)}
              onMouseLeave={() => setIsBookingPanelHovered(false)}
            >
              <div className="lg:sticky lg:top-4 self-start w-full h-full">
                <div className={cn(
                  "transition-all duration-300",
                  isBookingPanelHovered && "scale-[1.02] shadow-2xl"
                )}>
                  <QuickInfoCard
                    therapist={selectedTherapist}
                    isBestMatch={selectedTherapist ? therapists.findIndex(t => t.id === selectedTherapist.id) === 0 : false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile: Sticky bottom bar s CTA */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white/95 backdrop-blur-sm border-t border-transparent shadow-[0_-10px_30px_rgba(15,23,42,0.20)] z-50">
        <QuickInfoCardMobile
          therapist={selectedTherapist}
          isBestMatch={selectedTherapist ? therapists.findIndex(t => t.id === selectedTherapist.id) === 0 : false}
        />
      </div>
    </div>
  )
}

/**
 * Page Header - Fixní header pro app shell s elegantní breadcrumb navigací
 */
function PageHeader({ therapistsCount, totalCount }: { therapistsCount: number; totalCount?: number }) {
  const router = useRouter()
  const visibleCount = Math.min(therapistsCount, 5)

  return (
    <div className="flex-shrink-0 border-b border-transparent bg-white/80 backdrop-blur-sm shadow-[0_6px_18px_rgba(15,23,42,0.08)] relative overflow-visible">
      {/* Dekorativní gradient na pozadí */}
      <div className="absolute inset-0 bg-gradient-to-r from-seafoam-50/70 via-transparent to-seafoam-50/40 pointer-events-none" />
      {/* Jemná spodní linka pro futuristický efekt */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-seafoam-300/70 to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-4 sm:py-5">
        {/* Elegantní breadcrumb navigace (obsahuje již krokový indikátor) */}
        <BreadcrumbNavigation />
        {/* Tlačítko na hlavní stránku - moderní kruhové tlačítko s ikonou */}
        <button
          onClick={() => router.push('/')}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-seafoam-600 text-white hover:bg-seafoam-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          aria-label="Zpět na hlavní stránku"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

/**
 * Elegantní breadcrumb navigace - ukazuje flow a umožňuje kliknout na předchozí kroky
 */
function BreadcrumbNavigation() {
  const router = useRouter()
  
  return (
    <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm" aria-label="Breadcrumb">
      {/* Krok 1: Dotazník - klikatelný */}
      <button
        onClick={() => router.push('/questionnaire')}
        className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-seafoam-700 hover:text-seafoam-900 hover:bg-seafoam-50/60 transition-all duration-200"
      >
        <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Dotazník</span>
      </button>
      
      {/* Šipka */}
      <ChevronRight className="w-3.5 h-3.5 text-seafoam-300 flex-shrink-0" />
      
      {/* Krok 2: Výběr terapeuta - aktuální (neklikatelný, zvýrazněný) */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-seafoam-50/90 border border-seafoam-200">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-seafoam-500" />
        <span className="font-semibold text-seafoam-900">Výběr terapeuta</span>
      </div>
      
      {/* Šipka */}
      <ChevronRight className="w-3.5 h-3.5 text-seafoam-200 flex-shrink-0" />
      
      {/* Krok 3: Rezervace - neaktivní (šedý) */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-gray-400">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gray-300" />
        <span>Rezervace</span>
      </div>
    </nav>
  )
}


/**
 * Kompaktní seznam terapeutů (desktop/tablet) - stabilní pořadí, pouze stylování vybrané karty
 */
function TherapistList({
  therapists,
  selectedTherapistId,
  onTherapistSelect,
  userCoords,
}: {
  therapists: Therapist[]
  selectedTherapistId: string | null
  onTherapistSelect: (id: string) => void
  userCoords?: { lat: number; lon: number } | null
}) {
  // Nemutující sort v useMemo - vždy kopie, nikdy nemutit state
  // IMPORTANT: selectedTherapistId sem NEPATŘÍ - pořadí se nemění při výběru
  const sortedTherapists = React.useMemo(() => {
    return [...therapists].sort((a, b) => {
      const scoreA = a.match_score ?? 0
      const scoreB = b.match_score ?? 0
      return scoreB - scoreA
    })
  }, [therapists])
  
  // Omezit na max 5 terapeutů
  const top5Therapists = sortedTherapists.slice(0, 5)
  
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Seznam - grid s 5 řádky, konstantní výška, bez scrollu - rozšířený horizontálně */}
      <div className="flex-1 min-h-0 px-4 pt-3 pb-5 grid grid-rows-5 gap-2 auto-rows-fr overflow-hidden">
        {(() => {
          // Zkontroluj, jestli jsou všechny match % stejné
          const allMatchPercents = top5Therapists.map(t => Math.round(t.match_score ?? 0))
          const allSameMatch = allMatchPercents.length > 0 && allMatchPercents.every(p => p === allMatchPercents[0])
          
          return top5Therapists.map((therapist, index) => {
            const isSelected = therapist.id === selectedTherapistId
            
            return (
              <TherapistListItem
                key={therapist.id}
                ref={null}
                therapist={therapist}
                index={index}
                isSelected={isSelected}
                allSameMatch={allSameMatch}
                onClick={() => onTherapistSelect(therapist.id)}
                userCoords={userCoords}
              />
            )
          })
        })()}
      </div>
    </div>
  )
}

/**
 * Horizontální scroll pills pro mobile
 */
function TherapistListHorizontal({
  therapists,
  selectedTherapistId,
  onTherapistSelect,
}: {
  therapists: Therapist[]
  selectedTherapistId: string | null
  onTherapistSelect: (id: string) => void
}) {
  // Nemutující sort v useMemo - vždy kopie, nikdy nemutit state
  // IMPORTANT: selectedTherapistId sem NEPATŘÍ - pořadí se nemění při výběru
  const sortedTherapists = React.useMemo(() => {
    return [...therapists].sort((a, b) => {
      const scoreA = a.match_score ?? 0
      const scoreB = b.match_score ?? 0
      return scoreB - scoreA
    })
  }, [therapists])
  
  const top5Therapists = sortedTherapists.slice(0, 5)
  
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        {top5Therapists.map((therapist, index) => {
          const formatName = (name: string) => {
            if (!name) return 'Bez jména'
            return name.replace(/\b(MUDr|Mgr|Ing|Bc|PhDr|PhD|Dr|Prof)\.\s*,/g, '$1. ')
          }
          
          const name = formatName(therapist.fullName || therapist.name || 'Bez jména')
          const isBestMatch = index === 0
          const isSelected = therapist.id === selectedTherapistId
          
          return (
            <button
              key={therapist.id}
              onClick={() => onTherapistSelect(therapist.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-seafoam-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {isBestMatch && (
                  <span className={`
                    inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium
                    ${isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-seafoam-100 text-seafoam-700'
                    }
                  `}>
                    Doporučeno
                  </span>
                )}
                <span className="whitespace-nowrap">{name.split(' ')[0]}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Helper: Generování iniciál z jména (lidský fallback)
 */
function getInitials(name: string): string {
  if (!name || name.trim() === '') return ''
  
  // Odstraň tituly (Mgr., MUDr., Ing., atd.)
  const nameWithoutTitles = name.replace(/\b(MUDr|Mgr|Ing|Bc|PhDr|PhD|Dr|Prof)\.\s*/g, '').trim()
  
  const parts = nameWithoutTitles.split(/\s+/).filter(p => p.length > 0)
  if (parts.length >= 2) {
    // První písmeno z prvního a posledního slova
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    // První dvě písmena z jednoho slova
    return parts[0].substring(0, 2).toUpperCase()
  }
  return ''
}

/**
 * Avatar komponenta - podporuje image URL s object-cover a fallback na iniciály
 */
function Avatar({ 
  imageUrl, 
  initials, 
  name,
  size = 'md'
}: { 
  imageUrl: string | null
  initials: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-9 h-9 text-[9px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm'
  }
  
  const iconSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  
  const shouldShowImage = imageUrl && !imageError
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-seafoam-100 to-seafoam-200 flex items-center justify-center text-seafoam-700 font-semibold ring-1 ring-gray-200/30 relative`}>
      {shouldShowImage ? (
        <>
          <img 
            src={imageUrl} 
            alt={name}
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(false)
            }}
          />
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seafoam-100 to-seafoam-200">
              {initials || <User className={`${iconSizes[size]} text-gray-400`} />}
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seafoam-100 to-seafoam-200">
              {initials || <User className={`${iconSizes[size]} text-gray-400`} />}
            </div>
          )}
        </>
      ) : initials ? (
        initials
      ) : (
        <User className={`${iconSizes[size]} text-gray-400`} />
      )}
    </div>
  )
}

/**
 * Kompaktní položka seznamu terapeuta - premium SaaS navigation list
 */
const TherapistListItem = React.forwardRef<HTMLButtonElement, {
  therapist: Therapist
  index: number
  isSelected: boolean
  allSameMatch?: boolean
  onClick: () => void
  userCoords?: { lat: number; lon: number } | null
}>(({ therapist, index, isSelected, allSameMatch = false, onClick, userCoords = null }, ref) => {
  const therapistAny = therapist as any
  const formatName = (name: string) => {
    if (!name) return 'Bez jména'
    return name.replace(/\b(MUDr|Mgr|Ing|Bc|PhDr|PhD|Dr|Prof)\.\s*,/g, '$1. ')
  }
  
  const name = formatName(therapist.fullName || therapist.name || 'Bez jména')
  const isBestMatch = index === 0
  
  // Primární specializace (jen 1, ne 2) - přeložená do CZ
  const specialties = therapist.specialties || therapist.modalities || []
  const primarySpecialization = specialties.length > 0
    ? (() => {
        const first = specialties[0]
        if (typeof first !== 'string') return translateSpecialization(String(first || 'Fyzioterapeut'))
        return translateSpecialization(first)
      })()
    : 'Fyzioterapeut'
  
  // Lokalita + forma péče (meta řádek)
  const city = therapist.city || ''
  const meetingTypes = therapistAny.meeting_types || 
                      therapistAny.meeting_modes || 
                      therapist.modalities || 
                      []
  const hasOnline = meetingTypes.some((t: any) => 
    typeof t === 'string' && t.toLowerCase().includes('online')
  ) || therapistAny.practiceType === 'online'
  const hasInPerson = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('clinic') || 
      t.toLowerCase().includes('ordinace') ||
      t === 'clinic'
    )
  ) || therapistAny.practiceType === 'clinic'
  
  
  // Řádek 2: Rychlá klientská informace - "Lokalita • vzdálenost • čas"
  // Formát: Lokalita • vzdálenost • čas (fallback: Lokalita • Online, pokud vzdálenost není dostupná)
  let infoLine: string | null = null
  
  if (hasInPerson && userCoords) {
    // Má ordinaci - zkus získat vzdálenost
    const therapistLat = therapistAny.lat ?? therapistAny.latitude ?? null
    const therapistLon = therapistAny.lng ?? therapistAny.longitude ?? therapistAny.lon ?? null
    
    if (therapistLat !== null && therapistLon !== null && 
        typeof therapistLat === 'number' && typeof therapistLon === 'number' &&
        isFinite(therapistLat) && isFinite(therapistLon)) {
      try {
        const distanceKm = haversineKm(
          { lat: userCoords.lat, lon: userCoords.lon },
          { lat: therapistLat, lon: therapistLon }
        )
        // Zaokrouhlit na 1 desetinné místo
        const distanceRounded = Math.round(distanceKm * 10) / 10
        // Čas pěšky: rychlost 5 km/h
        const walkingTimeMinutes = Math.round((distanceKm / 5) * 60)
        // Formátování s českou čárkou
        const distanceFormatted = distanceRounded.toFixed(1).replace('.', ',')
        // Formát: Lokalita • vzdálenost • čas
        infoLine = city ? `${city} • ${distanceFormatted} km • ~${walkingTimeMinutes} min pěšky` : `${distanceFormatted} km • ~${walkingTimeMinutes} min pěšky`
      } catch (e) {
        // Fallback: Lokalita • Online
        infoLine = city ? `${city} • Online` : 'Online'
      }
    } else {
      // Fallback: Lokalita • Online
      infoLine = city ? `${city} • Online` : 'Online'
    }
  } else if (hasOnline && !hasInPerson) {
    // Pouze online - Lokalita • Online
    infoLine = city ? `${city} • Online` : 'Online'
  } else if (hasOnline && hasInPerson) {
    // Má obě možnosti, ale nemáme vzdálenost - Lokalita • Online
    infoLine = city ? `${city} • Online` : 'Online'
  } else {
    // Fallback: jen lokalita
    infoLine = city || null
  }
  
  
  // Avatar - foto nebo iniciály
  const photoUrl = therapistAny.photo || therapistAny.avatar || therapistAny.image || null
  const initials = getInitials(name)
  
  // Match score pro indikátor
  const matchScore = therapist.match_score ?? 0
  const matchPercent = Math.round(matchScore)
  
  // Kvalitativní hodnocení shody
  const getMatchQuality = (percent: number): { label: string; color: string } => {
    if (percent >= 75) return { label: 'Vysoká', color: 'bg-seafoam-500' }
    if (percent >= 50) return { label: 'Střední', color: 'bg-seafoam-400' }
    return { label: 'Základní', color: 'bg-seafoam-300' }
  }
  
  const matchQuality = getMatchQuality(matchPercent)
  
  
  return (
    <button
      ref={ref}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      className={`
        group relative w-full text-left transition-all duration-300 ease-out
        flex items-center
        cursor-pointer
        rounded-2xl
        ${isBestMatch 
          ? // Premium styling pro první kartu
            isSelected
              ? `bg-gradient-to-br from-white via-seafoam-50/40 to-white border border-seafoam-300/50 shadow-[0_8px_24px_rgba(13,148,136,0.20),0_4px_8px_rgba(0,0,0,0.08)] scale-[1.02] ring-1 ring-seafoam-300/40`
              : `bg-gradient-to-br from-white via-seafoam-50/50 to-white border border-seafoam-300/40 shadow-[0_6px_20px_rgba(13,148,136,0.18),0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(13,148,136,0.25),0_4px_10px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-seafoam-300/60 hover:ring-1 hover:ring-seafoam-300/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-seafoam-500 focus-visible:outline-offset-2`
          : // Standardní styling pro ostatní karty
            isSelected
              ? `bg-white border border-seafoam-400/70 shadow-[0_4px_12px_rgba(13,148,136,0.12),0_2px_4px_rgba(0,0,0,0.04)] scale-[1.01] ring-1 ring-seafoam-300/50`
              : `bg-white/95 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_2px_8px_rgba(13,148,136,0.06)] hover:bg-white hover:shadow-[0_4px_16px_rgba(13,148,136,0.10),0_2px_6px_rgba(0,0,0,0.06)] hover:border-seafoam-300/90 hover:scale-[1.01] hover:ring-1 hover:ring-seafoam-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-seafoam-500 focus-visible:outline-offset-2`
        }
      `}
      style={{ 
        height: '92%',
        minHeight: '92%',
      }}
    >
        {/* Hlavní obsah - premium spacing */}
        <div className="flex items-center gap-4 px-5 py-4.5 flex-1 min-w-0 relative z-0" style={{ height: '100%' }}>
          {/* Avatar - kruhový s badge overlay (připraveno pro fotografii) */}
          <div className="flex-shrink-0 relative">
            <Avatar 
              imageUrl={photoUrl}
              initials={initials}
              name={name}
              size="lg"
            />
            {/* Premium indicator na avataru pro první kartu */}
            {isBestMatch && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Střední část - jméno, město a chips */}
          <div className="flex-1 min-w-0 flex flex-col items-start justify-center gap-1">
            {/* Řádek 1: Jméno (semibold) */}
            <h3 className={`leading-tight tracking-[-0.01em] w-full text-left ${
              isBestMatch
                ? isSelected 
                  ? 'font-bold text-seafoam-700' 
                  : 'font-bold text-seafoam-700 group-hover:text-seafoam-800 transition-colors duration-200'
                : isSelected 
                  ? 'font-semibold text-gray-900' 
                  : 'font-semibold text-gray-900 group-hover:text-seafoam-700 transition-colors duration-200'
            }`} style={{ fontSize: '0.9375rem' }}>
              {name}
            </h3>
            
            {/* Řádek 2: Město (pokud existuje) */}
            {city && (
              <p className={`leading-tight font-normal w-full text-left transition-colors duration-200 ${
                isBestMatch
                  ? isSelected 
                    ? 'text-seafoam-600 font-medium' 
                    : 'text-seafoam-600 font-medium group-hover:text-seafoam-700'
                  : isSelected 
                    ? 'text-gray-600' 
                    : 'text-gray-500 group-hover:text-gray-600'
              }`} style={{ fontSize: '0.8125rem' }}>
                {city}
              </p>
            )}
          </div>
          
          {/* Indicator - vpravo, fixní slot (chevron pro nevybrané) */}
          {!isSelected && (
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {isBestMatch ? (
                <ArrowRight className="w-4 h-4 text-seafoam-500 opacity-80 group-hover:opacity-100 transition-opacity duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </div>
          )}
        </div>
      </button>
  )
})

TherapistListItem.displayName = 'TherapistListItem'

/**
 * TherapistHero - Moderní Hero blok s avatarem, badge, chips a summary
 */
function TherapistHero({
  therapist,
  isBestMatch = false,
}: {
  therapist: Therapist
  isBestMatch?: boolean
}) {
  const therapistAny = therapist as any
  const fullName = therapist.fullName || therapist.name || 'Terapeut'
  const name = fullName
  const initials = getInitials(name)
  const photoUrl = therapistAny.photo || therapistAny.avatar || therapistAny.image || null
  
  // Badge flags
  const isVerified = therapistAny.verified || therapistAny.isVerified || false
  
  // Specializace a lokalita pro chips (max 3: specializace / lokalita / forma)
  const specialties = therapist.specialties || therapist.modalities || []
  const primarySpecialization = specialties.length > 0
    ? translateSpecialization(String(specialties[0] || 'Fyzioterapeut'))
    : null
  
  const city = therapist.city || ''
  
  // Detekce online/osobně pro formu
  const meetingTypes = therapistAny.meeting_types || 
                      therapistAny.meeting_modes || 
                      therapist.modalities || 
                      []
  const hasOnline = meetingTypes.some((t: any) => 
    typeof t === 'string' && t.toLowerCase().includes('online')
  ) || therapistAny.practiceType === 'online'
  const hasInPerson = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('clinic') || 
      t.toLowerCase().includes('ordinace') ||
      t === 'clinic'
    )
  ) || therapistAny.practiceType === 'clinic'
  
  const formText = hasOnline && hasInPerson 
    ? 'Online i osobně' 
    : hasOnline 
      ? 'Online' 
      : hasInPerson 
        ? 'Osobně' 
        : null
  
  // Chips - max 3
  const chips = [
    primarySpecialization && primarySpecialization !== 'Fyzioterapeut' && { label: primarySpecialization, icon: null },
    city && { label: city, icon: MapPin },
    formText && { label: formText, icon: Video },
  ].filter(Boolean).slice(0, 3)
  
  // One-liner popis (pokud není v datech, slož fallback ze specializací)
  const bio = therapistAny.bio || ''
  const worksWith = therapistAny.worksWith || []
  const oneLiner = bio 
    ? bio.split('\n')[0].split('.')[0].trim() // První věta z bio
    : specialties.length > 0
      ? `${specialties.slice(0, 2).map(s => translateSpecialization(String(s))).join(', ')}${worksWith.length > 0 ? ` pro ${worksWith.slice(0, 2).join(', ')}` : ''}`
      : 'Fyzioterapeut připravený pomoci s vašimi potřebami'
  
  return (
    <div className="relative">
      {/* Elegantní gradient background pro hero sekci */}
      <div className="absolute inset-0 bg-gradient-to-br from-seafoam-50/30 via-white to-blue-50/20 rounded-2xl -z-10" />
      
      <div className="relative space-y-5">
        {/* Hlavní řádek: Jméno + Badge */}
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-start gap-3 mb-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {fullName}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isBestMatch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-seafoam-500 to-seafoam-600 text-white shadow-sm border border-seafoam-700/20">
                  <Star className="w-3.5 h-3.5" />
                  Doporučeno
                </span>
              )}
              {isVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm border border-blue-700/20">
                  <Verified className="w-3.5 h-3.5" />
                  Ověřeno
                </span>
              )}
            </div>
          </div>
          
          {/* One-liner popis - elegantní typography */}
          <p className="text-base text-gray-600 leading-relaxed font-light">
            {oneLiner}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * ExplainableMatch - Klikací explain bar s accordionem (3-5 krátkých bullet bodů)
 */
function ExplainableMatch({ therapist, reasons }: { therapist: Therapist, reasons: string[] }) {
  // Vytvoření shrnutí z důvodů (X, Y, Z z dotazníku) - zkrácené
  const summaryItems = reasons.slice(0, 3).map(r => {
    const cleaned = r.replace(/^[•\-\s]+/, '').trim()
    // Zkrácení dlouhých textů
    if (cleaned.length > 30) {
      return cleaned.substring(0, 30) + '...'
    }
    return cleaned
  })
  const summaryText = summaryItems.length > 0 
    ? `Sedí na: ${summaryItems.join(', ')}${reasons.length > 3 ? '...' : ''}`
    : 'Terapeut odpovídá vašim požadavkům'
  
  // Zkrácení bullet bodů na 3-5 krátkých (max 50 znaků)
  const shortReasons = reasons.slice(0, 5).map(r => {
    const cleaned = r.replace(/^[•\-\s]+/, '').trim()
    if (cleaned.length > 50) {
      return cleaned.substring(0, 47) + '...'
    }
    return cleaned
  })
  
  return (
    <div className="px-5 border-t border-seafoam-200/60 pt-4 mt-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-seafoam-100/80 border border-seafoam-200/60">
          <CheckCircle className="w-3 h-3 text-seafoam-600" />
        </div>
        <p className="text-sm text-gray-600">
          {summaryText}
        </p>
      </div>
    </div>
  )
}

/**
 * WhatWeWillClarify - Accordion s informacemi o upřesnění (defaultně zavřený)
 */
function WhatWeWillClarify({ therapist }: { therapist: Therapist }) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const therapistAny = therapist as any
  
  // Zjištění, co je třeba upřesnit
  const needsClarification: string[] = []
  
  // Cena
  const price = therapistAny.price || therapistAny.pricing || therapistAny.pricePerSession
  const priceRange = therapistAny.priceRange
  if ((!price || price === 'Na dotaz') && (!priceRange || !priceRange.minCZK)) {
    needsClarification.push('Cena (na dotaz)')
  }
  
  // Termín
  const nextAvailableDays = therapistAny.nextAvailableDays
  if (nextAvailableDays === null || nextAvailableDays === undefined) {
    needsClarification.push('Konkrétní termín (ověříme do 24 h)')
  }
  
  // Pokud není co upřesnit, nezobrazujeme blok
  if (needsClarification.length === 0) {
    return null
  }
  
  // Vytvoření souhrnného textu pro zavřený stav
  const summaryText = needsClarification.length === 2
    ? 'Cena a konkrétní termín upřesníme po odeslání'
    : needsClarification[0] === 'Cena (na dotaz)'
      ? 'Cena upřesníme po odeslání'
      : 'Konkrétní termín upřesníme po odeslání'
  
  return (
    <div className="border-b border-gray-100 pb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>{summaryText}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="mt-2 pt-2 space-y-1.5">
          {needsClarification.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * KPIDecisionRow - 4 karty s hlavními KPI pro rozhodování
 */
function KPIDecisionRow({ therapist }: { therapist: Therapist }) {
  const therapistAny = therapist as any
  
  // Helper: Bezpečné získání nejbližšího termínu (zkrácené texty)
  const getNextAvailableText = (): string => {
    const nextAvailableDays = therapistAny.nextAvailableDays !== undefined && therapistAny.nextAvailableDays !== null
      ? therapistAny.nextAvailableDays
      : null
    
    if (nextAvailableDays !== null && typeof nextAvailableDays === 'number') {
      return formatNextAvailable(nextAvailableDays)
    }
    
    const nextAvailable = therapistAny.next_available || therapistAny.nextAvailableSlot
    if (nextAvailable && typeof nextAvailable === 'string' && nextAvailable.trim() !== '') {
      // Zkrácení dlouhých textů
      const cleaned = nextAvailable.trim()
      if (cleaned.length > 25) {
        return cleaned.substring(0, 22) + '...'
      }
      return cleaned
    }
    
    return formatNextAvailable(null)
  }
  
  // Helper: Bezpečné získání ceny (zkrácené texty)
  const getPriceText = (): string => {
    const price = therapistAny.price || 
                  therapistAny.pricing || 
                  therapistAny.pricePerSession
    
    if (price !== null && price !== undefined) {
      if (typeof price === 'number' && price > 0) {
        return `${price} Kč`
      }
      if (typeof price === 'string' && price.trim() !== '' && price.toLowerCase() !== 'undefined') {
        const cleaned = price.trim()
        // Zkrácení dlouhých textů
        if (cleaned.length > 20) {
          return cleaned.substring(0, 17) + '...'
        }
        return cleaned
      }
    }
    
    const priceRange = therapistAny.priceRange
    if (priceRange) {
      const min = priceRange.minCZK || priceRange.min
      if (min !== null && min !== undefined && typeof min === 'number' && min > 0) {
        return `Od ${min} Kč`
      }
    }
    
    return 'Na dotaz'
  }
  
  // Helper: Forma péče
  const getFormText = (): string => {
    const meetingTypes = therapistAny.meeting_types || 
                        therapistAny.meeting_modes || 
                        therapist.modalities || 
                        []
    const hasOnline = meetingTypes.some((t: any) => 
      typeof t === 'string' && t.toLowerCase().includes('online')
    ) || therapistAny.practiceType === 'online'
    const hasInPerson = meetingTypes.some((t: any) => 
      typeof t === 'string' && (
        t.toLowerCase().includes('clinic') || 
        t.toLowerCase().includes('ordinace') ||
        t === 'clinic'
      )
    ) || therapistAny.practiceType === 'clinic'
    
    if (hasOnline && hasInPerson) return 'Online i osobně'
    if (hasOnline) return 'Online'
    if (hasInPerson) return 'Osobně'
    return 'Dle domluvy'
  }
  
  // Helper: Konzultace (délka) - zkrácené texty
  const getConsultationText = (): string => {
    const duration = therapistAny.duration || therapistAny.sessionDuration
    if (duration && typeof duration === 'number' && duration > 0) {
      return `${duration} min`
    }
    if (duration && typeof duration === 'string' && duration.trim() !== '') {
      const cleaned = duration.trim()
      // Zkrácení dlouhých textů
      if (cleaned.length > 20) {
        return cleaned.substring(0, 17) + '...'
      }
      return cleaned
    }
    return 'Dle domluvy'
  }
  
  const priceText = getPriceText()
  const showPriceTooltip = priceText === 'Na dotaz'
  
  const kpiCards = [
    {
      icon: Calendar,
      label: 'Nejbližší termín',
      value: getNextAvailableText(),
      tooltip: null,
    },
    {
      icon: CreditCard,
      label: 'Cena',
      value: priceText,
      tooltip: showPriceTooltip ? 'Cena se upřesní po domluvě s terapeutem, protože závisí na konkrétních potřebách a délce sezení' : null,
    },
    {
      icon: Video,
      label: 'Forma',
      value: getFormText(),
      tooltip: null,
    },
    {
      icon: Clock,
      label: 'Konzultace',
      value: getConsultationText(),
      tooltip: null,
    },
  ]
  
  // Barvy pro ikony podle typu
  const iconConfigs = [
    { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', hoverBg: 'hover:bg-blue-50/30' },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50/30' },
    { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'text-purple-600', hoverBg: 'hover:bg-purple-50/30' },
    { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600', hoverBg: 'hover:bg-amber-50/30' },
  ]
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiCards.map((card, index) => {
        const Icon = card.icon
        const config = iconConfigs[index % iconConfigs.length]
        return (
          <div 
            key={index}
            className={`group relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-transparent shadow-[0_6px_18px_rgba(15,23,42,0.08)] hover:shadow-[0_10px_30px_rgba(15,23,42,0.14)] transition-all duration-200 min-h-[95px] flex flex-col ${config.hoverBg}`}
          >
            <div className="relative z-10 flex items-start justify-between mb-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${config.bg} ${config.border} border group-hover:scale-105 transition-transform duration-200`}>
                <Icon className={`w-4 h-4 ${config.icon} flex-shrink-0 opacity-70`} />
              </div>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col min-h-0">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                {card.label}
              </span>
              {card.tooltip ? (
                <div className="group/tooltip relative w-full">
                  <p className="text-base font-medium text-gray-700 line-clamp-2 break-words leading-snug">
                    {card.value}
                  </p>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block z-20 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                    {card.tooltip}
                    <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                  </div>
                </div>
              ) : (
                <p className="text-base font-medium text-gray-700 line-clamp-2 break-words leading-snug">
                  {card.value}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


/**
 * SectionCard - Card wrapper pro obsahové sekce
 */
function SectionCard({
  title,
  icon: Icon,
  children,
  skeleton,
  id,
  sectionRef,
  isHighlighted,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
  skeleton?: React.ReactNode
  id?: string
  sectionRef?: React.RefObject<HTMLDivElement>
  isHighlighted?: boolean
}) {
  return (
    <div 
      ref={sectionRef} 
      id={id} 
      className={`${cardBaseClasses} ${cardPaddingClasses} scroll-mt-4 transition-all duration-300 ${
        isHighlighted 
          ? 'ring-1 ring-seafoam-500/20 bg-emerald-50/30' 
          : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 h-6">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
        <h2 className="text-base font-semibold text-gray-900">
          {title}
        </h2>
      </div>
      
      {/* Content */}
      <div className="space-y-2.5">
        {children || skeleton}
      </div>
    </div>
  )
}

/**
 * AboutSection - O terapeutovi
 */
function AboutSection({ therapist }: { therapist: Therapist }) {
  const bio = (therapist as any).bio || ''
  
  if (!bio) {
    return (
      <div className="text-center py-6 px-4 bg-gray-50/50 rounded-lg border border-gray-300/60">
        <p className="text-sm font-medium text-gray-500">Zatím neuvedeno</p>
        <p className="text-xs text-gray-400 mt-1.5">Doplníme po ověření profilu terapeuta</p>
      </div>
    )
  }
  
  return (
    <div className="prose prose-sm max-w-none">
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {bio}
      </p>
    </div>
  )
}

/**
 * SpecializationsSection - Specializace & metody (s lokalizací)
 */
function SpecializationsSection({ therapist }: { therapist: Therapist }) {
  const specialties = therapist.specialties || []
  const modalities = therapist.modalities || []
  const allTags = [...specialties, ...modalities].filter(Boolean).slice(0, 10)
  
  if (allTags.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-gray-50/50 rounded-lg border border-gray-300/60">
        <p className="text-sm font-medium text-gray-500">Zatím neuvedeno</p>
        <p className="text-xs text-gray-400 mt-1.5">Doplníme po ověření profilu terapeuta</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-wrap gap-2.5">
      {allTags.map((tag, index) => {
        const tagString = typeof tag === 'string' ? tag : String(tag)
        const translatedTag = translateSpecialization(tagString)
        
        return (
          <span
            key={index}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
          >
            {translatedTag}
          </span>
        )
      })}
    </div>
  )
}

/**
 * IdealForSection - Metody / přístup
 */
function IdealForSection({ therapist }: { therapist: Therapist }) {
  const worksWith = (therapist as any).worksWith || []
  const ageGroups = (therapist as any).age_supported || []
  
  const allGroups = [...worksWith, ...ageGroups].filter(Boolean)
  
  if (allGroups.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-gray-50/50 rounded-lg border border-gray-300/60">
        <p className="text-sm font-medium text-gray-500">Zatím neuvedeno</p>
        <p className="text-xs text-gray-400 mt-1.5">Doplníme po ověření profilu terapeuta</p>
      </div>
    )
  }
  
  return (
    <ul className="space-y-2.5">
      {allGroups.map((group, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-seafoam-100 border border-seafoam-200 mt-0.5 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-seafoam-600" />
          </div>
          <span className="text-gray-700 leading-relaxed">
            {typeof group === 'string' 
              ? group.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              : String(group)
            }
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * FirstVisitSection - Jak probíhá první návštěva
 */
function FirstVisitSection() {
  const steps = [
    {
      number: 1,
      title: 'Úvodní konzultace',
      description: 'Probereme vaše potíže, zdravotní historii a cíle léčby.'
    },
    {
      number: 2,
      title: 'Vyšetření',
      description: 'Provedeme komplexní vyšetření pohybového aparátu a funkčních testů.'
    },
    {
      number: 3,
      title: 'Léčebný plán',
      description: 'Navrhneme individuální léčebný plán a domluvíme se na dalších krocích.'
    }
  ]
  
  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.number} className="flex gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-seafoam-100 text-seafoam-700 text-sm font-semibold flex-shrink-0">
            {step.number}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * LocationSection - Lokalita & dostupnost
 */
function LocationSection({ therapist }: { therapist: Therapist }) {
  const therapistAny = therapist as any
  const address = therapistAny.address || therapist.city || ''
  
  // Detekce typů návštěv z různých fieldů
  const meetingTypes = therapistAny.meeting_types || 
                       therapistAny.meeting_modes || 
                       therapist.modalities || 
                       []
  
  const hasClinic = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('clinic') || 
      t.toLowerCase().includes('ordinace') ||
      t === 'clinic'
    )
  ) || therapistAny.practiceType === 'clinic'
  
  const hasHomeVisit = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('home') || 
      t.toLowerCase().includes('dojizdeni') ||
      t.toLowerCase().includes('home_visit') ||
      t === 'home_visit'
    )
  ) || therapistAny.practiceType === 'home_visits'
  
  const hasOnline = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('online') ||
      t === 'online'
    )
  ) || therapistAny.practiceType === 'online'
  
  return (
    <div className="space-y-4">
      {/* Adresa */}
      {address && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-300">
          <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {address}
            </p>
            {therapist.city && (
              <p className="text-sm text-gray-600 mt-1">
                {therapist.city}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Typy návštěv */}
      <div className="flex flex-wrap gap-2">
        {hasClinic && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Building2 className="w-4 h-4" />
            Ordinace
          </span>
        )}
        {hasHomeVisit && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Home className="w-4 h-4" />
            Dojíždění
          </span>
        )}
        {hasOnline && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
            <Video className="w-4 h-4" />
            Online
          </span>
        )}
      </div>
      
      {/* Placeholder pro mapu */}
      <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Mapa lokality</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton komponenty
 */
function AboutSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
    </div>
  )
}

function SpecializationsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse" />
      ))}
    </div>
  )
}

function IdealForSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function FirstVisitSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function LocationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse" />
        ))}
      </div>
      <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  )
}

/**
 * QuickLinks - Rychlé odkazy na sekce
 */
function QuickLinks({
  onSectionClick,
}: {
  onSectionClick: (sectionId: string) => void
}) {
  const links = [
    { id: 'methods', label: 'Specializace' },
    { id: 'first-visit', label: 'První návštěva' },
    { id: 'location', label: 'Lokalita' },
  ]
  
  return (
    <div className="mt-2 pb-2 border-b border-gray-300">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-xs text-gray-500 mr-0.5">Rychlé odkazy</span>
        {links.map((link, index) => (
          <React.Fragment key={link.id}>
            {index > 0 && (
              <span className="text-gray-300 text-xs">•</span>
            )}
            <button
              onClick={() => onSectionClick(link.id)}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs text-gray-500 hover:bg-slate-50 hover:text-gray-700 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-seafoam-500 focus-visible:outline-offset-2"
            >
              {link.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}


/**
 * Střední panel - Detail terapeuta s moderním SaaS layoutem
 */
function TherapistDetailPanel({
  therapist,
  therapistIndex,
  scrollContainerRef,
  heroSectionRef,
}: {
  therapist: Therapist
  therapistIndex: number
  scrollContainerRef: React.RefObject<HTMLDivElement> | null
  heroSectionRef: React.RefObject<HTMLDivElement>
}) {
  const rawReasonsSource = 
    (Array.isArray(therapist.reasons) && therapist.reasons) ||
    (Array.isArray(therapist.matchReasons) && therapist.matchReasons) ||
    []
  
  let recommendationReasons: string[] = []
  try {
    recommendationReasons = pickTopReasonsCs(rawReasonsSource, 'detail', 5)
  } catch (err) {
    console.error('Error processing reasons:', err)
    recommendationReasons = []
  }
  
  const isBestMatch = therapistIndex === 0
  
  const therapistAny = therapist as any
  
  return (
    <div className="space-y-6">
      {/* Hero sekce - nad fold */}
      <div className="space-y-5">
        <TherapistHero therapist={therapist} isBestMatch={isBestMatch} />
        <ExplainableMatch therapist={therapist} reasons={recommendationReasons} />
      </div>
      
      {/* Accordion sekce */}
      <div className="space-y-4">
        <Accordion type="single" collapsible defaultValue="expertise" className="w-full space-y-3">
          {/* Odbornost - defaultně otevřeno */}
          <div>
            <AccordionItem value="expertise" className="bg-white/80 backdrop-blur-sm rounded-xl border border-seafoam-100/60 shadow-sm hover:shadow-md transition-all duration-200 p-0 overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-5 py-4">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-seafoam-50/50 border border-seafoam-100/60">
                      <Target className="w-4 h-4 text-seafoam-600" />
                    </div>
                    <span className="text-base font-semibold text-gray-900">Odbornost</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6 px-5 bg-seafoam-50/20">
                <div className="space-y-6">
                  {/* O terapeutovi */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">O terapeutovi</h3>
                    <AboutSection therapist={therapist} />
                  </div>
                  
                  {/* Specializace a diagnózy */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Specializace a diagnózy</h3>
                    <SpecializationsSection therapist={therapist} />
                  </div>
                  
                  {/* Metody / přístup */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Metody / přístup</h3>
                    <IdealForSection therapist={therapist} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* První návštěva - s preview */}
          <div>
            <AccordionItem value="first-visit" className="bg-white/80 backdrop-blur-sm rounded-xl border border-seafoam-100/60 shadow-sm hover:shadow-md transition-all duration-200 p-0 overflow-hidden [&[data-state=closed]_p.preview]:block [&[data-state=open]_p.preview]:hidden">
              <AccordionTrigger className="hover:no-underline px-5 py-4">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-seafoam-50/50 border border-seafoam-100/60 flex-shrink-0">
                      <FileText className="w-4 h-4 text-seafoam-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-semibold text-gray-900">První návštěva</span>
                      <p className="preview text-xs text-gray-500 truncate mt-1 hidden">
                        Úvodní konzultace, vyšetření, léčebný plán
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-5 px-5 bg-seafoam-50/20">
                <FirstVisitSection />
              </AccordionContent>
            </AccordionItem>
          </div>
          
          {/* Praktické info - s preview */}
          <div>
            <AccordionItem value="practical" className="bg-white/80 backdrop-blur-sm rounded-xl border border-seafoam-100/60 shadow-sm hover:shadow-md transition-all duration-200 p-0 overflow-hidden [&[data-state=closed]_p.preview]:block [&[data-state=open]_p.preview]:hidden">
              <AccordionTrigger className="hover:no-underline px-5 py-4">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-seafoam-50/50 border border-seafoam-100/60 flex-shrink-0">
                      <MapPin className="w-4 h-4 text-seafoam-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-semibold text-gray-900">Praktické info</span>
                      <p className="preview text-xs text-gray-500 truncate mt-1 hidden">
                        {therapistAny.address || therapist.city || 'Lokalita, storno, délka sezení'}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-5 px-5 bg-seafoam-50/20">
                <LocationSection therapist={therapist} />
                {/* Storno, délka atd. - pokud jsou data */}
                {(therapistAny.cancellationPolicy || therapistAny.sessionDuration) && (
                  <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                    {therapistAny.cancellationPolicy && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Storno:</span>
                        <p className="text-sm text-gray-700 mt-1">{therapistAny.cancellationPolicy}</p>
                      </div>
                    )}
                    {therapistAny.sessionDuration && (
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Délka sezení:</span>
                        <p className="text-sm text-gray-700 mt-1">{therapistAny.sessionDuration}</p>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </div>
    </div>
  )
}

/**
 * RecommendationSummaryCard - Shrnutí doporučení
 */
function RecommendationSummaryCard({
  therapist,
  isBestMatch,
  reasons,
}: {
  therapist: Therapist
  isBestMatch: boolean
  reasons: string[]
}) {
  return (
    <div className={`${cardBaseClasses} ${cardPaddingClasses} bg-gradient-to-br from-seafoam-50 to-seafoam-100/50 border-seafoam-200`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-seafoam-500 text-white flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {isBestMatch ? 'Naše doporučení pro vás' : 'Další vhodná možnost'}
          </h3>
          {isBestMatch && (
            <p className="text-sm text-gray-700">
              Tento terapeut nejlépe odpovídá vašim potřebám z dotazníku
            </p>
          )}
        </div>
      </div>
      
      {reasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Proč vám ho doporučujeme:
          </h4>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-seafoam-200 rounded-lg text-xs text-gray-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-seafoam-600 flex-shrink-0" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Allowed domains for iframe embedding (security allowlist)
 */
const ALLOWED_BOOKING_DOMAINS = [
  'zaptime.cz',
  'reservanto.cz',
  'booking.reservanto.cz',
]

/**
 * Check if URL is from an allowed booking domain
 */
function isAllowedBookingDomain(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    return ALLOWED_BOOKING_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

/**
 * Slot Picker Modal - for proposing consultation time slots
 */
function SlotPickerModal({
  isOpen,
  onClose,
  onAddSlot,
  currentSlots,
}: {
  isOpen: boolean
  onClose: () => void
  onAddSlot: (slot: Date) => void
  currentSlots: number
}) {
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedTime, setSelectedTime] = React.useState<string>('09:00')

  // Generate time slots (every 30 minutes from 07:00 to 20:00)
  const timeSlots: string[] = []
  for (let hour = 7; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(timeStr)
    }
  }

  const today = new Date()
  const minDate = today.toISOString().split('T')[0]

  const handleConfirm = () => {
    if (!selectedDate) {
      alert('Vyberte prosím datum')
      return
    }

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const combinedDate = new Date(selectedDate)
    combinedDate.setHours(hours, minutes, 0, 0)

    // Validate: not in the past
    if (combinedDate < new Date()) {
      alert('Nelze vybrat termín v minulosti')
      return
    }

    onAddSlot(combinedDate)
    setSelectedDate('')
    setSelectedTime('09:00')
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Přidat navržený termín</SheetTitle>
          <SheetDescription>
            Vyberte datum a čas pro konzultaci (maximálně 3 návrhy)
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Datum</label>
            <input
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={!selectedDate || currentSlots >= 3}
            >
              Přidat
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Booking Modal Component - for iframe embedding
 */
function BookingModal({
  open,
  onOpenChange,
  bookingUrl,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingUrl: string
}) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAllowed, setIsAllowed] = React.useState(false)

  React.useEffect(() => {
    if (open && bookingUrl) {
      const allowed = isAllowedBookingDomain(bookingUrl)
      setIsAllowed(allowed)
      setIsLoading(true)
    }
  }, [open, bookingUrl])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  if (!isAllowed) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg font-semibold text-gray-900">
              Rezervace termínu
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-600">
              Rezervaci dokončíte v rezervačním systému terapeuta.
            </SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-[calc(100vh-120px)] px-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Tento rezervační systém není podporován pro vložení.
              </p>
              <Button
                onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}
                variant="outline"
              >
                Otevřít v nové kartě
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <SheetTitle className="text-lg font-semibold text-gray-900">
            Rezervace termínu
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600">
            Rezervaci dokončíte v rezervačním systému terapeuta.
          </SheetDescription>
        </SheetHeader>
        <div className="relative h-[calc(100vh-120px)] w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-seafoam-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Načítání rezervačního systému...</p>
              </div>
            </div>
          )}
          <iframe
            src={bookingUrl}
            className="w-full h-full border-0"
            title="Rezervační systém"
            allow="payment"
            onLoad={handleIframeLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Service Combobox Component
 */
function ServiceCombobox({
  services,
  selectedServiceId,
  onSelect,
  selectedForm,
  isServiceCompatibleWithForm,
  getRecommendedService,
}: {
  services: TherapistService[]
  selectedServiceId: string | null
  onSelect: (serviceId: string) => void
  selectedForm: 'online' | 'in-person' | null
  isServiceCompatibleWithForm: (service: TherapistService, form: 'online' | 'in_person' | null) => boolean
  getRecommendedService: () => TherapistService | null
}) {
  const [open, setOpen] = React.useState(false)
  
  const recommendedService = getRecommendedService()
  
  // Filter services based on form compatibility
  const filteredServices = React.useMemo(() => {
    return services.filter((service: TherapistService) => {
      if (!selectedForm) return true
      const normalizedForm: 'online' | 'in_person' | null =
        selectedForm === 'online'
          ? 'online'
          : selectedForm === 'in-person'
          ? 'in_person'
          : null
      return isServiceCompatibleWithForm(service, normalizedForm) || service.modality === 'both'
    })
  }, [services, selectedForm, isServiceCompatibleWithForm])
  
  // Separate services into recommended and others
  const recommendedServices = filteredServices.filter(s => recommendedService?.id === s.id)
  const otherServices = filteredServices.filter(s => recommendedService?.id !== s.id)
  
  // Get selected service display text - always show "Vstupní vyšetření"
  const getSelectedServiceText = () => {
    if (selectedServiceId) {
      return 'Vstupní vyšetření'
    }
    return 'Vyberte službu...'
  }
  
  const formatServicePrice = (service: TherapistService) => {
    if (service.priceCzk) {
      return `${service.priceCzk.toLocaleString('cs-CZ')} Kč`
    }
    if (service.priceFromCzk) {
      return `od ${service.priceFromCzk.toLocaleString('cs-CZ')} Kč`
    }
    return 'Cena upřesněna po domluvě'
  }
  
  const handleSelect = (value: string) => {
    // Prevent deselecting - if clicking already selected item, do nothing
    if (value === selectedServiceId) {
      setOpen(false)
      return
    }
    onSelect(value)
    setOpen(false)
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "w-full px-4 py-2.5 rounded-full text-sm border border-gray-300 bg-white",
          "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1",
          "hover:bg-gray-50 hover:border-gray-300",
          "transition-colors duration-150",
          "text-left flex items-center justify-between"
        )}
      >
        <span className="truncate text-gray-900">{getSelectedServiceText()}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border border-gray-300 shadow-lg rounded-xl overflow-hidden" align="start">
        <Command>
          <CommandList className="p-2">
            {/* Doporučeno - First Section */}
            {recommendedServices.length > 0 && (
              <CommandGroup>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Doporučeno
                </div>
                {recommendedServices.map((service: TherapistService) => (
                  <CommandItem
                    key={service.id}
                    value={service.id}
                    onSelect={() => handleSelect(service.id)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 cursor-pointer",
                      "transition-colors duration-150",
                      selectedServiceId === service.id 
                        ? 'bg-gray-100' 
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">Vstupní vyšetření</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {service.durationMin} min · {formatServicePrice(service)}
                        </div>
                      </div>
                      {selectedServiceId === service.id && (
                        <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Ostatní služby */}
            {otherServices.length > 0 && (
              <>
                {recommendedServices.length > 0 && (
                  <div className="h-px bg-gray-200 my-2 mx-2" />
                )}
                <CommandGroup>
                  {recommendedServices.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ostatní služby
                    </div>
                  )}
                  {otherServices.map((service: TherapistService) => (
                    <CommandItem
                      key={service.id}
                      value={service.id}
                      onSelect={() => handleSelect(service.id)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 cursor-pointer",
                        "transition-colors duration-150",
                        selectedServiceId === service.id 
                          ? 'bg-gray-100' 
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">Vstupní vyšetření</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {service.durationMin} min · {formatServicePrice(service)}
                          </div>
                        </div>
                        {selectedServiceId === service.id && (
                          <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            
            {/* Empty state */}
            {filteredServices.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                Žádná služba není k dispozici.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * SmartBookingWidget - Pravý panel s booking formulářem (desktop/tablet)
 */
function QuickInfoCard({
  therapist,
  isBestMatch,
}: {
  therapist: Therapist | null
  isBestMatch: boolean
}) {
  const [selectedForm, setSelectedForm] = React.useState<'online' | 'in-person' | null>(null)
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null)
  const [note, setNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [serviceError, setServiceError] = React.useState<string | null>(null)
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false)
  const [submitSuccess, setSubmitSuccess] = React.useState<{ bookingId: string } | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmittingLocked, setIsSubmittingLocked] = React.useState(false)
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(null)
  const [showSlotModal, setShowSlotModal] = React.useState(false)
  const [nearestSlot, setNearestSlot] = React.useState<AvailableSlot | null>(null)
  const [nextSlots, setNextSlots] = React.useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = React.useState(false)
  const [slotError, setSlotError] = React.useState<string | null>(null)
  const [slotValidationError, setSlotValidationError] = React.useState<string | null>(null)
  
  // Get user preferences from questionnaire
  const userAnswers = React.useMemo(() => {
    try {
      return getAnswers()
    } catch {
      return null
    }
  }, [])
  
  if (!therapist) {
    return (
      <div className={`${cardBaseClasses} ${cardPaddingClasses}`}>
        <QuickInfoSkeleton />
      </div>
    )
  }
  
  const therapistAny = therapist as any
  
  // Define these BEFORE useEffect hooks that use them
  const availableLanguages = therapist.languages || []
  const userPreferredLanguages = userAnswers?.languages || []
  
  // Ensure therapist has at least one service (default if missing)
  let services = therapist.services || []
  if (!services || services.length === 0) {
    services = [{
      id: `default-intake-${therapist.id}`,
      name: "Úvodní fyzioterapeutické vyšetření",
      durationMin: 60,
      priceFromCzk: undefined,
      modality: "both" as const,
      tags: ["fyzio", "vyšetření"]
    }]
  }
  
  // Detect available forms from therapist
  const meetingTypes = therapistAny.meeting_types || 
                       therapistAny.meeting_modes || 
                       therapist.modalities || 
                       []
  const hasOnline = meetingTypes.some((t: any) => 
    typeof t === 'string' && t.toLowerCase().includes('online')
  ) || therapistAny.practiceType === 'online'
  const hasInPerson = meetingTypes.some((t: any) => 
    typeof t === 'string' && (
      t.toLowerCase().includes('clinic') || 
      t.toLowerCase().includes('ordinace') ||
      t === 'clinic'
    )
  ) || therapistAny.practiceType === 'clinic'
  
  // Initialize form selection based on therapist capabilities and user preferences
  React.useEffect(() => {
    if (selectedForm === null) {
      // Default logic: if therapist has both, prefer user preference, else use what's available
      if (hasOnline && hasInPerson) {
        // Check user preference
        const userMeetingType = userAnswers?.meetingType
        if (userMeetingType === 'online') {
          setSelectedForm('online')
        } else if (userMeetingType === 'clinic' || userMeetingType === 'home') {
          setSelectedForm('in-person')
        } else {
          // Default to online if both available
          setSelectedForm('online')
        }
      } else if (hasOnline) {
        setSelectedForm('online')
      } else if (hasInPerson) {
        setSelectedForm('in-person')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapist.id, hasOnline, hasInPerson, userAnswers?.meetingType])
  
  // Initialize languages from user preferences or therapist's first language
  React.useEffect(() => {
    if (selectedLanguages.length === 0 && availableLanguages.length > 0) {
      if (userAnswers?.languages && userAnswers.languages.length > 0) {
        // Filter to only languages available from therapist
        const available = userAnswers.languages.filter((lang: string) => 
          availableLanguages.some((al: string) => al.toLowerCase() === lang.toLowerCase())
        )
        if (available.length > 0) {
          setSelectedLanguages(available)
        } else {
          // Fallback to first available language
          setSelectedLanguages([availableLanguages[0]])
        }
      } else {
        // Default to first available language
        setSelectedLanguages([availableLanguages[0]])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapist.id])
  
  // Initialize service selection - auto-select first service (required)
  // Only set if not already selected (don't overwrite user choice)
  React.useEffect(() => {
    if (selectedServiceId === null && services.length > 0) {
      // Always select first service (which should be default-intake or first real service)
      setSelectedServiceId(services[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapist.id])
  
  // Auto-select when services are loaded asynchronously (if user hasn't selected yet)
  React.useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.length])
  
  // Načítání slotů při změně therapistId, serviceId nebo form
  React.useEffect(() => {
    if (!therapist?.id || !selectedServiceId || !selectedForm) {
      setNearestSlot(null)
      setNextSlots([])
      setSlotsLoading(false)
      return
    }
    
    const loadSlots = async () => {
      setSlotsLoading(true)
      setSlotError(null)
      
      try {
        const from = new Date()
        const to = new Date()
        to.setDate(to.getDate() + 14) // +14 dní
        
        const params = new URLSearchParams({
          serviceId: selectedServiceId,
          from: from.toISOString(),
          to: to.toISOString(),
        })
        if (selectedForm) {
          params.append('form', selectedForm === 'online' ? 'online' : 'in_person')
        }
        
        const response = await fetch(`/api/therapists/${therapist.id}/slots?${params}`)
        if (!response.ok) {
          throw new Error('Failed to load slots')
        }
        
        const data = await response.json()
        const slots: AvailableSlot[] = data.slots || []
        
        // Seřadit od nejbližšího
        slots.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        
        // nearestSlot = první slot
        // nextSlots = další 2-3 sloty (bez nearestSlot)
        if (slots.length > 0) {
          setNearestSlot(slots[0])
          setNextSlots(slots.slice(1, 4)) // max 3 další sloty
        } else {
          setNearestSlot(null)
          setNextSlots([])
        }
      } catch (err: any) {
        console.error('Failed to load slots:', err)
        setSlotError('Nepodařilo se načíst dostupné termíny')
        setNearestSlot(null)
        setNextSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    
    loadSlots()
  }, [therapist?.id, selectedServiceId, selectedForm])
  
  // Get location text
  const locationText = therapist.city || 'Online'
  
  // Get form text for summary
  const getFormText = () => {
    if (selectedForm === 'online') return 'Online'
    if (selectedForm === 'in-person') return 'Osobně'
    if (hasOnline && hasInPerson) return 'Online i osobně'
    if (hasOnline) return 'Online'
    if (hasInPerson) return 'Osobně'
    return 'Dle domluvy'
  }
  
  // Get languages text for summary
  const getLanguagesText = () => {
    if (selectedLanguages.length > 0) {
      return selectedLanguages.join(', ')
    }
    if (userPreferredLanguages.length > 0) {
      // Show user preferred languages that are available
      const available = userPreferredLanguages.filter((lang: string) =>
        availableLanguages.some((al: string) => al.toLowerCase() === lang.toLowerCase())
      )
      if (available.length > 0) {
        return available.join(', ')
      }
    }
    if (availableLanguages.length > 0) {
      return availableLanguages.slice(0, 2).join(', ')
    }
    return 'Čeština'
  }
  
  // Get service text for summary
  const getServiceText = () => {
    if (selectedServiceId === 'unknown') {
      return 'Doporučí terapeut'
    }
    if (selectedServiceId) {
      const service = services.find((s: TherapistService) => s.id === selectedServiceId)
      if (service) {
        return service.name
      }
    }
    return null
  }
  
  const handleLanguageToggle = (lang: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(lang)) {
        return prev.filter(l => l !== lang)
      } else {
        return [...prev, lang]
      }
    })
  }
  
  // Helper: Check if service is compatible with selected form
  const isServiceCompatibleWithForm = (
    service: TherapistService,
    form: 'online' | 'in_person' | null,
  ): boolean => {
    if (!form) return true
    if (service.modality === 'both') return true
    if (form === 'online' && service.modality === 'online') return true
    if (form === 'in_person' && service.modality === 'in_person') return true
    return false
  }
  
  // Helper: Get recommended service based on questionnaire
  const getRecommendedService = (): TherapistService | null => {
    if (services.length === 0) return null
    
    // Try to match based on problemArea or conditions from questionnaire
    const problemArea = userAnswers?.problemArea?.toLowerCase() || ''
    const problemDetail = userAnswers?.problemDetail?.toLowerCase() || ''
    
    // Look for services that match problem tags
    for (const service of services) {
      if (service.tags && service.tags.length > 0) {
        const serviceTags = service.tags.map(t => t.toLowerCase())
        if (serviceTags.some(tag => problemArea.includes(tag) || problemDetail.includes(tag))) {
          return service
        }
      }
    }
    
    return null
  }
  
  // Handle service selection with form compatibility check
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    
    const service = services.find((s: TherapistService) => s.id === serviceId)
    if (!service || !selectedForm) return
    
    // Check compatibility and adjust form if needed
    const normalizedForm: 'online' | 'in_person' | null =
      selectedForm === 'online'
        ? 'online'
        : selectedForm === 'in-person'
        ? 'in_person'
        : null

    if (!isServiceCompatibleWithForm(service, normalizedForm)) {
      // Auto-adjust form to compatible option
      if (service.modality === 'online') {
        setSelectedForm('online')
      } else if (service.modality === 'in_person') {
        setSelectedForm('in-person')
      }
    }
  }
  
  // Auto-adjust form when service changes
  React.useEffect(() => {
    if (selectedServiceId && selectedForm) {
      const service = services.find((s: TherapistService) => s.id === selectedServiceId)
      const normalizedForm: 'online' | 'in_person' | null =
        selectedForm === 'online'
          ? 'online'
          : selectedForm === 'in-person'
          ? 'in_person'
          : null

      if (service && !isServiceCompatibleWithForm(service, normalizedForm)) {
        if (service.modality === 'online') {
          setSelectedForm('online')
        } else if (service.modality === 'in_person') {
          setSelectedForm('in-person')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId])
  
  // Check if current service is compatible with selected form
  const isCurrentServiceCompatible = React.useMemo(() => {
    if (!selectedServiceId || !selectedForm) return true
    const service = services.find((s: TherapistService) => s.id === selectedServiceId)
    if (!service) return true
    const normalizedForm: 'online' | 'in_person' | null =
      selectedForm === 'online'
        ? 'online'
        : selectedForm === 'in-person'
        ? 'in_person'
        : null
    return isServiceCompatibleWithForm(service, normalizedForm)
  }, [selectedServiceId, selectedForm, services, isServiceCompatibleWithForm])
  
  const handleSubmit = async () => {
    // Double-submit protection
    if (isSubmitting || isSubmittingLocked) {
      return
    }

    // Clear previous errors and success
    setServiceError(null)
    setSubmitError(null)
    setSubmitSuccess(null)
    
    // Validate service is selected
    if (!selectedServiceId) {
      setServiceError('Vyberte službu')
      return
    }
    
    if (!selectedForm) {
      return
    }

    // Validate slot is selected
    if (!selectedSlot) {
      setSlotValidationError('Vyberte prosím termín.')
      setSubmitError(null)
      return
    }
    
    // Clear slot validation error if slot is selected
    setSlotValidationError(null)
    
    // Validate service compatibility
    const selectedService = services.find((s: TherapistService) => s.id === selectedServiceId)
    const normalizedForm: 'online' | 'in_person' | null =
      selectedForm === 'online'
        ? 'online'
        : selectedForm === 'in-person'
        ? 'in_person'
        : null

    if (selectedService && !isServiceCompatibleWithForm(selectedService, normalizedForm)) {
      setSubmitError('Vybraná služba není kompatibilní s formou. Zkuste vybrat jinou službu nebo změnit formu.')
      return
    }
    
    setIsSubmitting(true)
    setIsSubmittingLocked(true)
    
    try {
      // Use selected language or fallback to first available
      const finalLanguage = selectedLanguages.length > 0 
        ? selectedLanguages[0]
        : (availableLanguages.length > 0 ? availableLanguages[0] : 'cs')
      
      const bookingData = {
        therapistId: therapist.id,
        serviceId: selectedServiceId,
        form: selectedForm === 'online' ? 'online' : 'in_person',
        language: finalLanguage,
        startsAt: selectedSlot.startsAt,
        note: note.trim() || undefined,
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Nepodařilo se rezervovat termín' }))
        
        // Handle slot conflict
        if (response.status === 409 && errorData.code === 'slot_taken') {
          setSubmitError('Termín už někdo obsadil, vyberte jiný')
          // Refresh slots
          setSelectedSlot(null)
          setShowSlotModal(true)
          return
        }
        
        throw new Error(errorData.error || 'Nepodařilo se rezervovat termín')
      }
      
      const result = await response.json()
      
      // Success - show confirmation
      setSubmitSuccess({ bookingId: result.bookingId })
      
      // Scroll to success message
      setTimeout(() => {
        const successElement = document.getElementById('booking-success')
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
      
    } catch (error: any) {
      console.error('Booking error:', error)
      setSubmitError(error.message || 'Nepodařilo se rezervovat termín. Zkuste to prosím znovu.')
    } finally {
      setIsSubmitting(false)
      // Unlock after a short delay to prevent rapid double-submits
      setTimeout(() => setIsSubmittingLocked(false), 1000)
    }
  }
  
  const handleRetry = () => {
    setSubmitError(null)
    handleSubmit()
  }
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-seafoam-100/60 shadow-xl flex flex-col h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] overflow-hidden relative" style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)' }}>
      {/* Dekorativní gradient v headeru */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-seafoam-400 via-seafoam-300 to-seafoam-400" />
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-seafoam-100/50 bg-gradient-to-br from-seafoam-50/30 to-transparent">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Objednat konzultaci</h3>
        <p className="text-sm text-gray-500">Vyplňte údaje a terapeut vás kontaktuje</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
        {/* Služba - Service Selection with Combobox */}
        {services.length > 0 ? (
          <div className="space-y-2">
            <label htmlFor="booking-service" className="block text-sm font-semibold text-gray-900">
              Služba <span className="text-red-500">*</span>
            </label>
            
            {/* Combobox */}
            <ServiceCombobox
              services={services}
              selectedServiceId={selectedServiceId}
              onSelect={handleServiceChange}
              selectedForm={selectedForm}
              isServiceCompatibleWithForm={isServiceCompatibleWithForm}
              getRecommendedService={getRecommendedService}
            />
            
            {/* Error message if service validation fails */}
            {serviceError && (
              <p className="text-sm text-red-600 mt-1.5">{serviceError}</p>
            )}
            
            {/* Recommendation Info Row */}
            {(() => {
              const recommendedService = getRecommendedService()
              const selectedService = selectedServiceId
                ? services.find((s: TherapistService) => s.id === selectedServiceId)
                : null
              
              // Show compatibility warning if service doesn't match form
              if (selectedService && selectedForm) {
                const normalizedForm: 'online' | 'in_person' | null =
                  selectedForm === 'online'
                    ? 'online'
                    : selectedForm === 'in-person'
                    ? 'in_person'
                    : null

                if (normalizedForm && !isServiceCompatibleWithForm(selectedService, normalizedForm)) {
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Vybraná služba není kompatibilní s formou. Forma byla automaticky upravena.
                      </p>
                    </div>
                  )
                }
              }
              
              if (selectedService && recommendedService) {
                const isRecommended = recommendedService.id === selectedService.id
                if (isRecommended) {
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200/60">
                      <p className="text-sm text-blue-800 leading-relaxed flex items-center gap-2">
                        <Star className="w-4 h-4 flex-shrink-0 text-blue-600" />
                        <span>Doporučená volba z dotazníku</span>
                      </p>
                    </div>
                  )
                } else {
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-between gap-3">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Doporučili jsme: <span className="font-semibold">{recommendedService.name}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleServiceChange(recommendedService.id)}
                        className="text-sm font-medium text-amber-800 hover:text-amber-900 underline flex-shrink-0 transition-colors"
                      >
                        Přepnout
                      </button>
                    </div>
                  )
                }
              }
              
              return null
            })()}
            
            {/* Show service description if available */}
            {selectedServiceId && (() => {
              const service = services.find((s: TherapistService) => s.id === selectedServiceId)
              if (service?.description) {
                return (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {service.description}
                  </p>
                )
              }
              return null
            })()}
            
            {/* Price display */}
            {selectedServiceId && (() => {
              const service = services.find((s: TherapistService) => s.id === selectedServiceId)
              if (!service) return null
              
              const hasPrice = service.priceCzk || service.priceFromCzk
              if (!hasPrice) {
                return (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    Cena upřesněna po domluvě
                  </p>
                )
              }
              
              return (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Konečné potvrzení služby a termínu proběhne s terapeutem
                </p>
              )
            })()}
          </div>
        ) : (
          <div>
            <label htmlFor="booking-service" className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Služba
            </label>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Nevíte, jakou službu zvolit?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Napište krátce potíž do poznámky. Terapeut doporučí vhodnou službu a cenu potvrdí.
              </p>
              <button
                type="button"
                onClick={() => handleServiceChange('unknown')}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Doporučte mi službu
              </button>
              <p className="text-xs text-gray-500 mt-2">Cena upřesněna po domluvě</p>
            </div>
          </div>
        )}
        
        {/* Výběr termínu - Required */}
        {!submitSuccess && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Vyberte termín <span className="text-red-500">*</span>
            </label>
            {selectedSlot && (
              <div className="mb-2 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full h-auto py-1.5 px-3 gap-2 flex-1"
                  onClick={() => setShowSlotModal(true)}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-sm">
                    {(() => {
                      const date = new Date(selectedSlot.startsAt)
                      const weekday = date.toLocaleDateString('cs-CZ', { weekday: 'short' })
                      const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1)
                      const day = date.getDate()
                      const month = date.getMonth() + 1
                      const startTime = date.toLocaleTimeString('cs-CZ', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })
                      return `${weekdayCapitalized} ${day}. ${month}. · ${startTime}`
                    })()}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSlotModal(true)}
                  className="h-auto py-1.5 px-2 text-xs text-gray-600 hover:text-gray-900"
                >
                  Změnit
                </Button>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Odstranit termín"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {!selectedSlot && (
              <>
                <Button
                  onClick={() => setShowSlotModal(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Vybrat termín
                </Button>
              </>
            )}

            {/* Slot picker dialog – dostupný i pro tlačítko "Změnit" */}
            {selectedServiceId && (() => {
              const selectedService = services.find((s: TherapistService) => s.id === selectedServiceId)
              if (!selectedService) return null

              return (
                <SlotPickerDialog
                  open={showSlotModal}
                  onOpenChange={setShowSlotModal}
                  onConfirm={(slot: AvailableSlot) => {
                    setSelectedSlot(slot)
                    setShowSlotModal(false)
                  }}
                  therapistId={therapist.id}
                  selectedService={selectedService}
                  form={
                    selectedForm === 'online'
                      ? 'online'
                      : selectedForm === 'in-person'
                      ? 'in_person'
                      : undefined
                  }
                />
              )
            })()}
          </div>
        )}
        
        {/* Volitelná poznámka */}
        {!submitSuccess && (
          <div className="space-y-2">
            <label htmlFor="booking-note" className="block text-sm font-semibold text-gray-900">
              Poznámka <span className="font-normal text-gray-500 text-xs">(volitelné)</span>
            </label>
            <Input
              id="booking-note"
              type="text"
              placeholder="Např. akutní bolest zad..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              maxLength={200}
            />
          </div>
        )}
        
        {/* Co bude dál - Modern Steps */}
        {!submitSuccess && (
          <div className="pt-2 pb-2">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Co bude dál
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                  Rezervace termínu je okamžitě potvrzena
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                  Terapeut vás kontaktuje před termínem s dalšími informacemi
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                  První konzultace v rezervovaném termínu
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {submitSuccess && submitSuccess.bookingId && (
          <div id="booking-success" className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 mb-1">
                  Rezervace potvrzena
                </h4>
                <p className="text-sm text-green-800 mb-3">
                  Váš termín byl úspěšně rezervován. Terapeut vás bude kontaktovat s dalšími informacemi.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-green-700">
                    Rezervační kód: <span className="font-mono font-semibold">{submitSuccess.bookingId?.slice(-8).toUpperCase() || 'N/A'}</span>
                  </span>
                  <Button
                    onClick={() => {
                      if (submitSuccess.bookingId) {
                        navigator.clipboard.writeText(submitSuccess.bookingId)
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-100"
                  >
                    Kopírovat
                  </Button>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-green-700 hover:text-green-900">
                    Zobrazit detail
                  </summary>
                  <p className="mt-2 font-mono text-green-600 break-all">
                    {submitSuccess.bookingId || 'N/A'}
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {submitError && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">
                  Chyba při odesílání
                </h4>
                <p className="text-sm text-red-800 mb-3">
                  {submitError}
                </p>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Zkusit znovu
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Sticky CTA Footer - Modern Design */}
      <div className="flex-shrink-0 px-6 py-5 bg-gray-50/50 border-t border-gray-100">
        <div className="space-y-3">
          {submitSuccess ? (
            /* Success CTA */
            <Button
              onClick={() => {
                // Reset form state
                setSubmitSuccess(null)
                setSubmitError(null)
                setSelectedForm(null)
                setSelectedServiceId(null)
                setSelectedLanguages([])
                setNote('')
                setSelectedSlot(null)
              }}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md"
            >
              Hotovo
            </Button>
          ) : (
            /* Primary CTA - Request Appointment */
            <Button
              onClick={handleSubmit}
              disabled={!selectedForm || !selectedServiceId || !isCurrentServiceCompatible || !selectedSlot || isSubmitting || isSubmittingLocked}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Odesílám...
                </span>
              ) : (
                'Rezervovat termín'
              )}
            </Button>
          )}
          
          {/* Secondary CTA - Direct Booking (if booking provider is configured) */}
          {therapist.bookingProvider && 
           therapist.bookingProvider !== 'none' && 
           therapist.bookingUrl && (
            <>
              {(therapist.bookingMode || 'iframe') === 'iframe' ? (
                <>
                  <Button
                    onClick={() => setBookingModalOpen(true)}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Rezervovat termín
                  </Button>
                  <BookingModal
                    open={bookingModalOpen}
                    onOpenChange={setBookingModalOpen}
                    bookingUrl={therapist.bookingUrl}
                  />
                </>
              ) : (
                <Button
                  onClick={() => window.open(therapist.bookingUrl, '_blank', 'noopener,noreferrer')}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Rezervovat termín
                </Button>
              )}
            </>
          )}
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-3 leading-tight">
          Odpověď obvykle do 24 hodin
        </p>
      </div>
    </div>
  )
}

/**
 * QuickInfoCardMobile - Sticky bottom bar pro mobile
 */
function QuickInfoCardMobile({
  therapist,
  isBestMatch,
}: {
  therapist: Therapist | null
  isBestMatch: boolean
}) {
  if (!therapist) {
    return (
      <div className="p-4">
        <div className="h-12 bg-gray-200 rounded-xl w-full animate-pulse" />
      </div>
    )
  }
  
  return (
    <div className="p-4">
      <button className="w-full bg-seafoam-600 hover:bg-seafoam-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-lg">
        Požádat o termín
      </button>
      <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
        Tento krok je zcela nezávazný
      </p>
    </div>
  )
}

/**
 * Skeleton pro QuickInfoCard
 */
function QuickInfoSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-3 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          <div className="h-8 bg-gray-200 rounded-lg w-16 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse" />
        </div>
      </div>
      <div>
        <div className="h-10 bg-gray-200 rounded-xl w-full animate-pulse mb-3" />
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state pro detail panel
 */
function EmptyDetailState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center px-6">
        <p className="text-sm font-medium text-gray-900 mb-2">Vyberte terapeuta ze seznamu</p>
        <p className="text-sm text-gray-500">
          Klikněte na terapeuta pro zobrazení detailu
        </p>
      </div>
    </div>
  )
}
