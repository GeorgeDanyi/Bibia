'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/src/config/routes'
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { AvailabilityCalendar } from '@/components/ui/AvailabilityCalendar'
import { getTherapistAvailabilityStatus } from '@/lib/utils/availability-status'
import { AvailabilityState } from '@/lib/constants/availability-states'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  MapPin, 
  ArrowLeft,
  Calendar,
  CreditCard,
  WashingMachine,
  UserPlus,
  Building2,
  Heart,
  Car,
  Clock,
  Users,
  Star,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Wheelchair } from 'phosphor-react'

type PageProps = {
  params: {
    id: string
  }
}

// Language to flag mapping
const languageFlags: Record<string, string> = {
  'cs': '🇨🇿',
  'cestina': '🇨🇿',
  'cz': '🇨🇿',
  'en': '🇬🇧',
  'anglictina': '🇬🇧',
  'de': '🇩🇪',
  'nemcina': '🇩🇪',
  'ru': '🇷🇺',
  'rustina': '🇷🇺',
  'sk': '🇸🇰',
  'slovenstina': '🇸🇰',
  'uk': '🇺🇦',
  'ukrajinština': '🇺🇦',
  'es': '🇪🇸',
  'spanelstina': '🇪🇸',
}

// Insurance company names
const insuranceNames: Record<string, string> = {
  'vzp': 'VZP',
  'ozp': 'OZP',
  'zp': 'ZP',
  'cpzp': 'ČPZP',
  'vojp': 'VOJ-P',
}

// Convert technical specialization to human-readable format
function formatSpecialization(specialty: string): string {
  const translations: Record<string, string> = {
    // General specialties
    'general_physiotherapy': 'Fyzioterapie',
    'manual_therapy': 'Manuální terapie',
    
    // Niche specialties
    'pelvic_floor': 'pánevní dno',
    'spine_pain': 'bolest zad',
    'back_pain': 'bolest zad',
    'neck_pain': 'bolest krku',
    'womens_health': 'ženské zdraví',
    'menstrual_pain': 'menstruační bolesti',
    'pregnancy': 'těhotenství',
    'postpartum': 'poporodní péče',
    'shoulder': 'rameno',
    'knee': 'koleno',
    'hip': 'kyčel',
    'ankle': 'kotník',
    'elbow': 'loket',
    'wrist': 'zápěstí',
    'sport': 'sportovní fyzioterapie',
    'sports_injury': 'sportovní zranění',
    'pediatrics': 'dětská fyzioterapie',
    'geriatrics': 'geriatrická fyzioterapie',
    
    // Common conditions
    'chronic_pain': 'chronická bolest',
    'acute_pain': 'akutní bolest',
    'post_surgery': 'rehabilitace po operaci',
    'rehabilitation': 'rehabilitace',
  }
  
  // Try exact match first
  if (translations[specialty.toLowerCase()]) {
    return translations[specialty.toLowerCase()]
  }
  
  // Try partial match (e.g., "spine_pain" contains "spine")
  const lowerSpecialty = specialty.toLowerCase()
  for (const [key, value] of Object.entries(translations)) {
    if (lowerSpecialty.includes(key) || key.includes(lowerSpecialty)) {
      return value
    }
  }
  
  // If already in human-readable format (contains spaces, Czech characters), return as is
  if (/[áéíóúýčďěňřšťžů]/.test(specialty) || specialty.includes(' ')) {
    return specialty
  }
  
  // Fallback: convert snake_case to readable format
  return specialty
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Format specialties array to human-readable string
function formatSpecializations(specialties: string[]): string {
  if (!specialties || specialties.length === 0) {
    return 'Fyzioterapeut'
  }
  
  const formatted = specialties
    .slice(0, 3) // Take max 3 specialties
    .map(formatSpecialization)
    .filter(Boolean)
  
  if (formatted.length === 0) {
    return 'Fyzioterapeut'
  }
  
  // Format: "Fyzioterapie – [specialty1], [specialty2]"
  const base = formatted[0].toLowerCase().includes('fyzioterapie') 
    ? formatted[0] 
    : 'Fyzioterapie'
  
  const areas = formatted.filter(s => !s.toLowerCase().includes('fyzioterapie'))
  
  if (areas.length === 0) {
    return base
  }
  
  return `${base} – ${areas.join(', ')}`
}

// Component: TherapistHeroCard
function TherapistHeroCard({ 
  therapist, 
  fullName, 
  city, 
  distance, 
  emotionalHeadline 
}: { 
  therapist: any
  fullName: string
  city: string
  distance: number | null
  emotionalHeadline: string
}) {
  const [showMatchTooltip, setShowMatchTooltip] = useState(false)
  
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Extract and format value proof (specialization) - human-readable format
  const specialties = therapist.specialties || therapist.modalities || []
  const valueProof = formatSpecializations(specialties)

  // Extract trust signals
  const ratingValue = typeof therapist.rating === 'object' 
    ? therapist.rating?.average 
    : therapist.rating
  const rating = typeof ratingValue === 'number' ? ratingValue : 4.6
  const reviewsCount = therapist.reviewsCount || therapist.reviews?.length || (typeof therapist.rating === 'object' ? therapist.rating?.count : 0) || 0
  const yearsExperience = therapist.yearsExperience || therapist.experience || 0

  return (
    <Card className="bg-gradient-to-br from-seafoam-100 via-seafoam-100 to-seafoam-100 rounded-2xl shadow-md border-0 p-6 relative h-full flex flex-col">
      {/* TRUST - Rating flag attached to top edge */}
      <div className="absolute top-4 left-0 z-20">
        <div className="relative">
          {/* Flag body */}
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-gray-900 shadow-lg">
            <Star className="w-3 h-3 fill-yellow-600 text-yellow-600 flex-shrink-0" />
            <span className="text-xs font-bold whitespace-nowrap">{rating.toFixed(1)}</span>
            {reviewsCount > 0 && (
              <span className="text-[10px] text-gray-700 whitespace-nowrap">({reviewsCount})</span>
            )}
          </div>
          {/* Flag corner cut (triangle) */}
          <div className="absolute -right-2 top-0 w-0 h-0 border-l-[8px] border-l-yellow-400 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent"></div>
        </div>
      </div>

      {/* Main content: 2-column grid layout */}
      <div className="relative z-10 pt-12 flex-1 flex items-center">
        <div className="grid grid-cols-12 gap-6 w-full">
          {/* LEFT COLUMN: Identity and trust (60-70%) */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col justify-center">
            {/* 1. Name - Primary identification */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-6 mb-4">
              {fullName}
            </h1>
            
            {/* 2. Specialization - Value proof */}
            <p className="text-base md:text-lg font-medium text-gray-700 mb-3">
              {valueProof}
            </p>
            
            {/* 3. Location - Practical location with distance */}
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {city}
                {distance !== null && distance !== undefined && ` • ${Math.round(distance)} km`}
              </span>
            </div>
            
            {/* 4. Trust badge - "Doporučeno pro vás" */}
            <div className="relative">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-seafoam-100 text-seafoam-700 cursor-help transition-colors hover:bg-seafoam-200"
                onMouseEnter={() => setShowMatchTooltip(true)}
                onMouseLeave={() => setShowMatchTooltip(false)}
              >
                <span className="text-xs font-medium">Doporučeno pro vás</span>
                <Info className="w-3 h-3 flex-shrink-0" />
              </div>
              {/* Tooltip explanation */}
              {showMatchTooltip && (
                <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-20">
                  <p className="font-semibold mb-1">Proč je tento terapeut doporučen?</p>
                  <p className="text-gray-300">
                    Tento terapeut odpovídá vašim kritériím z dotazníku. Doporučení je založeno na specializaci, dostupnosti a lokalitě.
                  </p>
                  <div className="absolute -top-1 left-6 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Photo/avatar - Circular with initials */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 flex justify-center md:justify-end">
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-3xl md:text-4xl font-bold text-seafoam-600 overflow-hidden">
                {therapist.profileImage ? (
                  <img 
                    src={therapist.profileImage} 
                    alt={fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Component: StatsCard - Experience, Patients, Reviews
function StatsCard({ 
  therapist, 
  recommendationCount 
}: { 
  therapist: any
  recommendationCount: number
}) {
  const yearsExperience = therapist.yearsExperience || therapist.experience || 8
  const patientsCount = therapist.patientsCount || therapist.totalPatients || 3500
  const reviewsCount = recommendationCount || therapist.reviewsCount || 2800

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="grid grid-cols-3 gap-4">
        {/* Experience */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-seafoam-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-6 h-6 text-seafoam-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{yearsExperience}</p>
          <p className="text-xs text-gray-600 mt-1">Let praxe</p>
        </div>
        
        {/* Patients */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-seafoam-100 flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-seafoam-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{patientsCount > 1000 ? `${(patientsCount / 1000).toFixed(1)}k` : patientsCount}+</p>
          <p className="text-xs text-gray-600 mt-1">Pacientů</p>
        </div>
        
        {/* Reviews */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-seafoam-100 flex items-center justify-center mx-auto mb-2">
            <Star className="w-6 h-6 text-seafoam-600 fill-seafoam-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{reviewsCount > 1000 ? `${(reviewsCount / 1000).toFixed(1)}k` : reviewsCount}+</p>
          <p className="text-xs text-gray-600 mt-1">Recenzí</p>
        </div>
      </div>
    </Card>
  )
}

// Component: AboutCard
function AboutCard({ bio }: { bio: string }) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-3">O terapeutovi</h2>
      <p className="text-sm text-gray-700 leading-relaxed">
        {bio}
      </p>
    </Card>
  )
}

// Component: RequestAppointmentModal
function RequestAppointmentModal({
  open,
  onOpenChange,
  therapistName,
  availability
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  therapistName: string
  availability: any
}) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement backend submission
    console.log('Form submitted:', { name, contact, message, therapistName })
    // For now, just close the modal
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Požádat o termín</SheetTitle>
          <SheetDescription>
            Vaši žádost odešleme terapeutovi {therapistName}. Komunikace proběhne přímo v aplikaci{' '}
            {availability.state === 'FULL' 
              ? 'ohledně budoucích možností' 
              : 's dostupnými termíny'}.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Jméno <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vaše jméno"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email nebo telefon <span className="text-red-500">*</span>
            </label>
            <Input
              id="contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email@priklad.cz nebo +420 123 456 789"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
              Zpráva <span className="text-gray-400 text-xs font-normal">(volitelné)</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Máte nějaké specifické požadavky nebo otázky? (volitelné)"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white font-semibold"
            >
              Odeslat žádost
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Component: InfoTabsCard
function InfoTabsCard({ 
  therapist, 
  availability
}: { 
  therapist: any
  availability: any
}) {
  const [showRequestModal, setShowRequestModal] = useState(false)
  
  const therapistName = therapist.fullName || therapist.name || 'terapeutovi'

  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
      {/* Content - No scroll */}
      <div className="flex-1 min-h-0">
        <div className="space-y-3">
          {/* 2. Read-only mini kalendář (aktuální měsíc) */}
            <div className="mb-3">
              <AvailabilityCalendar />
            </div>

            {/* 3. Legenda stavů (volné / na dotaz / obsazeno) */}
            <div className="mb-2 pt-10">
              <div className="flex items-center gap-2.5">
                <p className="text-xs font-medium text-gray-700 whitespace-nowrap">Legenda:</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-green-50 border border-green-100 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">volné termíny</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-amber-50 border border-amber-100 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">na dotaz</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-gray-50 border border-gray-100 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">obsazeno</span>
                </div>
              </div>
            </div>

            {/* 4. Vysvětlující text, že kalendář je orientační */}
            <div className="mb-2">
              <p className="text-xs text-gray-500 leading-snug">
                Kalendář je orientační a zobrazuje přibližnou dostupnost. Po odeslání žádosti vás terapeut kontaktuje přímo v aplikaci.
              </p>
            </div>

            {/* 5. CTA "Požádat o termín" + vysvětlení dalšího kroku */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white font-semibold rounded-xl py-3 shadow-md"
                data-action-priority="primary"
                data-action-type="primary-cta"
                data-cta-label="Požádat o termín"
              >
                Požádat o termín
              </Button>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                {availability.state === 'AVAILABLE' 
                  ? 'Terapeut vás kontaktuje přes aplikaci s dostupnými termíny.'
                  : availability.state === 'LIMITED'
                  ? 'Terapeut vás kontaktuje přes aplikaci s dostupnými termíny.'
                  : ''}
              </p>
            </div>
        </div>
        
        {/* Request Appointment Modal */}
        <RequestAppointmentModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          therapistName={therapistName}
          availability={availability}
        />
      </div>
    </Card>
  )
}

// Component: SideInfoCard
function SideInfoCard({ 
  title, 
  children, 
  className = '' 
}: { 
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col ${className}`}>
      <h3 className="text-xs font-semibold text-gray-900 mb-3 flex-shrink-0">{title}</h3>
      <div className="flex-1 flex flex-col justify-start">
        {children}
      </div>
    </Card>
  )
}

// Component: InfoSlider
function InfoSlider({ 
  slides 
}: { 
  slides: Array<{ title: string; content: React.ReactNode }>
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  
  const canGoPrevious = activeSlideIndex > 0
  const canGoNext = activeSlideIndex < slides.length - 1
  
  const goToPrevious = () => {
    if (canGoPrevious) {
      setActiveSlideIndex(activeSlideIndex - 1)
    }
  }
  
  const goToNext = () => {
    if (canGoNext) {
      setActiveSlideIndex(activeSlideIndex + 1)
    }
  }
  
  if (slides.length === 0) return null
  
  return (
    <div className="relative">
      {/* Slider container with fixed height */}
      <div className="overflow-hidden rounded-xl h-[140px]">
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="w-full flex-shrink-0 h-full">
              <SideInfoCard title={slide.title} className="h-full">
                {slide.content}
              </SideInfoCard>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation and indicator - only show if more than one slide */}
      {slides.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          {/* Slide indicator */}
          <div className="text-[10px] text-gray-400 font-medium">
            {activeSlideIndex + 1} / {slides.length}
          </div>
          
          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className={`p-1 rounded-md transition-all ${
                canGoPrevious
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer'
                  : 'text-gray-200 cursor-not-allowed'
              }`}
              aria-label="Předchozí"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              disabled={!canGoNext}
              className={`p-1 rounded-md transition-all ${
                canGoNext
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer'
                  : 'text-gray-200 cursor-not-allowed'
              }`}
              aria-label="Další"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TherapistDetailPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = params

  const [therapist, setTherapist] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTherapist() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/therapists/${id}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        if (isMounted) {
          setTherapist(data)
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || 'Nepodařilo se načíst detail terapeuta.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTherapist()
    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return (
      <main className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-seafoam-600 mx-auto mb-4" />
          <p className="text-gray-700">Načítám profil terapeuta…</p>
        </div>
      </main>
    )
  }

  if (error || !therapist) {
    return (
      <main className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6">
          <button
            type="button"
            onClick={() => router.push(ROUTES.results)}
            className="text-sm text-gray-700 mb-4 hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět na výsledky
          </button>
          <Card className="bg-white rounded-2xl shadow-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-2">Profil terapeuta se nepodařilo načíst</h2>
              <p className="text-sm text-gray-700">
                Zkuste se prosím vrátit na přehled výsledků a otevřít tento profil znovu.
              </p>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  // Extract therapist data
  const fullName: string = therapist.fullName || therapist.name || 'Terapeut'
  const city: string = therapist.city || 'Město neuvedeno'
  const distance = therapist.distance || therapist.distanceKm || null
  const address = therapist.address || therapist.street || ''
  const postalCode = therapist.postalCode || therapist.postcode || ''
  const fullAddress = address && postalCode ? `${address}, ${postalCode} ${city}` : city
  
  // Get match score for availability
  const matchScore = therapist.match_score || therapist.matchPercent || null
  const matchPercent = typeof matchScore === 'number' ? Math.round(matchScore) : null
  
  // Get availability status
  const availability = getTherapistAvailabilityStatus(therapist, matchPercent)
  
  
  // Languages
  const languages = therapist.languages || []
  const languageCodes = languages.map((lang: string) => lang.toLowerCase())
  
  // Bio
  const bio = therapist.bio || therapist.description || 'Ke své praxi přistupuji individuálně a s respektem k potřebám každého klienta. Největší smysl mi dává pomáhat lidem znovu se hýbat bez bolesti – ať už po úrazu, při dlouhodobých potížích nebo v běžném životě. Věřím v komplexní přístup, který kombinuje manuální terapii, cvičení a edukaci.'
  
  // Practical info
  const barrierFree = therapist.barrier_free || therapist.barrierFree || false
  const parking = therapist.parking || false
  const wc = therapist.wc !== false
  const cardPayment = therapist.cardPayment || therapist.card_payment || false
  const acceptingNew = therapist.acceptingNew !== false
  
  // Insurance
  const insuranceAccepted = therapist.insuranceAccepted || therapist.insurance || (therapist.accepts_insurance ? ['vzp', 'ozp', 'zp'] : [])
  const isSelfPay = insuranceAccepted.length === 0
  
  // Price range
  const pricePerHour = therapist.pricePerHour || therapist.price_per_hour || null
  let priceLevel = 'Standardní'
  if (pricePerHour) {
    if (pricePerHour < 800) priceLevel = 'Dostupná'
    else if (pricePerHour > 1200) priceLevel = 'Vyšší'
  }
  
  // Coordinates for map
  const lat = therapist.latitude || therapist.lat
  const lng = therapist.longitude || therapist.lng
  const hasCoordinates = lat && lng

  // Recommendation count
  const recommendationCount = therapist.recommendationCount || therapist.reviewsCount || 36

  // Emotional headline
  const emotionalHeadline = therapist.headline || 'Pomáhám lidem vrátit se k pohybu bez bolesti a strachu.'

  return (
    <main className="h-screen bg-gray-100 overflow-hidden">
      <div className="max-w-[1280px] mx-auto h-full px-4 py-4">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push(ROUTES.results)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na výsledky
        </button>

        {/* White content block containing all cards */}
        <div className="bg-white rounded-3xl shadow-lg p-6 h-[calc(100%-60px)] overflow-hidden">
          {/* Main grid: 2 columns (8/12 left, 4/12 right) with aligned first row */}
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* First row: Hero card and InfoTabsCard aligned - same height */}
            <div className="col-span-12 lg:col-span-8 lg:row-start-1 h-full">
              <TherapistHeroCard
                therapist={therapist}
                fullName={fullName}
                city={city}
                distance={distance}
                emotionalHeadline={emotionalHeadline}
              />
            </div>

            <div className="col-span-12 lg:col-span-4 lg:row-start-1 h-full">
              <InfoTabsCard
                therapist={therapist}
                availability={availability}
              />
            </div>

            {/* LEFT COLUMN - Rest of content (8/12) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 lg:row-start-2 overflow-hidden">
              {/* Stats card - Trust signals (praxe, pacienti, recenze) */}
              <StatsCard 
                therapist={therapist}
                recommendationCount={recommendationCount}
              />

              {/* About card - Expertise and bio */}
              <AboutCard bio={bio} />
            </div>

            {/* RIGHT COLUMN - Secondary cards (4/12) with slider */}
            <div className="col-span-12 lg:col-span-4 lg:row-start-2">
              <InfoSlider
                slides={[
                  {
                    title: 'Praktické informace',
                    content: (
                      <div className="space-y-2.5">
                        {wc && (
                          <div className="flex items-center gap-2">
                            <WashingMachine className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">WC</span>
                          </div>
                        )}
                        {cardPayment && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Platba kartou</span>
                          </div>
                        )}
                        {parking && (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Parkování</span>
                          </div>
                        )}
                        {barrierFree && (
                          <div className="flex items-center gap-2">
                            <Wheelchair className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Bezbariérový přístup</span>
                          </div>
                        )}
                        {acceptingNew && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Přijímá nové pacienty</span>
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    title: 'Cena',
                    content: (
                      <>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-seafoam-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-base">💰</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">{priceLevel}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Cena se může lišit podle typu terapie
                        </p>
                      </>
                    )
                  },
                  ...(languageCodes.length > 0 ? [{
                    title: 'Jazyky',
                    content: (
                      <>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                          Jazyky, ve kterých je možné absolvovat terapii
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {languageCodes.map((lang: string, idx: number) => {
                            const langNames: Record<string, string> = {
                              'cs': 'Čeština',
                              'en': 'Angličtina',
                              'de': 'Němčina',
                              'ru': 'Ruština',
                              'sk': 'Slovenština',
                              'uk': 'Ukrajinština',
                              'es': 'Španělština',
                            }
                            const langName = langNames[lang] || lang
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-seafoam-50 text-seafoam-700 border border-seafoam-100"
                              >
                                {langName}
                              </span>
                            )
                          })}
                        </div>
                      </>
                    )
                  }] : []),
                  {
                    title: 'Pojišťovny',
                    content: (
                      <>
                        {isSelfPay ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                            <span className="text-xs text-gray-700">Pouze samoplátce</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {insuranceAccepted.map((ins: string, idx: number) => {
                              const insName = insuranceNames[ins.toLowerCase()] || ins.toUpperCase()
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-seafoam-100 text-seafoam-700 border border-seafoam-100"
                                >
                                  {insName}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
