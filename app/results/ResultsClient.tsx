'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BadgePill } from '@/components/ui/BadgePill'
import {
  MapPin,
  Laptop,
  Filter,
  Star,
  X,
  Expand,
  CheckCircle,
  Phone,
  Calendar,
  Search,
  Grid3x3,
  List,
  HelpCircle,
} from 'lucide-react'
import { useSearchResults } from '@/lib/hooks/useSearchResults'
import QuestionnaireSummary from '@/components/search/QuestionnaireSummary'
import { toArray } from '@/lib/utils/normalize'
import type { TherapistMatch } from '@/lib/matching/types'
import { ROUTES } from '@/src/config/routes'
import { useState } from 'react'
import { SHOW_LEGACY_MATCH } from '@/src/config/flags'
import { Input } from '@/components/ui/input'
import { pickTopReasonsCs } from '@/lib/matching/reasonCopy'
import { getTherapistAvailabilityStatus } from '@/lib/utils/availability-status'
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'

// Function to translate diagnosis terms to Czech
function translateDiagnosis(term: string): string {
  const translations: Record<string, string> = {
    // Spine and back issues
    'spine_pain': 'Bolesti páteře',
    'back_pain': 'Bolesti zad',
    'spine': 'Páteř',
    'back': 'Záda',
    'neck_pain': 'Bolesti krku',
    'cervical': 'Krk',
    'lumbar': 'Bederní páteř',
    'thoracic': 'Hrudní páteř',
    
    // Pelvic and postpartum
    'pelvic_floor': 'Pánevní dno',
    'pelvic': 'Pánevní',
    'postpartum': 'Poporodní',
    'postpartum_rehab': 'Poporodní rehabilitace',
    'incontinence': 'Inkontinence',
    'postpartum_care': 'Poporodní péče',
    
    // Joints and limbs
    'knee': 'Koleno',
    'ankle': 'Kotník',
    'shoulder': 'Rameno',
    'elbow': 'Loket',
    'hip': 'Kyčel',
    'wrist': 'Zápěstí',
    
    // Common conditions
    'arthritis': 'Artritida',
    'tendinitis': 'Tendinitida',
    'bursitis': 'Bursitida',
    'sprain': 'Podvrtnutí',
    'strain': 'Natažení',
    'fracture': 'Zlomenina',
    'surgery': 'Operace',
    'post_surgery': 'Po operaci',
    'rehabilitation': 'Rehabilitace',
    
    // Neurological
    'stroke': 'Mrtvice',
    'parkinson': 'Parkinson',
    'multiple_sclerosis': 'Roztroušená skleróza',
    'ms': 'RS',
    'als': 'ALS',
    'neuropathy': 'Neuropatie',
    
    // Sports and injuries
    'sports_injury': 'Sportovní zranění',
    'tennis_elbow': 'Tenisový loket',
    'golfers_elbow': 'Golfový loket',
    'rotator_cuff': 'Rotátorová manžeta',
    'acl': 'ACL',
    'mcl': 'MCL',
    'meniscus': 'Menisky',
    
    // Age groups
    'pediatric': 'Dětská',
    'geriatric': 'Geriatrická',
    'adult': 'Dospělá',
    
    // Other
    'chronic_pain': 'Chronická bolest',
    'acute_pain': 'Akutní bolest',
    'muscle_pain': 'Svalová bolest',
    'joint_pain': 'Bolest kloubů',
    'headache': 'Bolest hlavy',
    'migraine': 'Migréna'
  }
  
  // Try exact match first
  if (translations[term.toLowerCase()]) {
    return translations[term.toLowerCase()]
  }
  
  // Try partial matches
  const lowerTerm = term.toLowerCase()
  for (const [key, translation] of Object.entries(translations)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      return translation
    }
  }
  
  // If no translation found, return original term with first letter capitalized
  return term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
}

interface FilterChipProps {
  label: string
  onRemove: () => void
  type?: 'location' | 'condition' | 'availability' | 'practice' | 'language'
}

function FilterChip({ label, onRemove, type = 'condition' }: FilterChipProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'location':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'condition':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'availability':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'practice':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'language':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm ${getTypeStyles()}`}>
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

interface TherapistCardProps {
  therapist: TherapistMatch
  onBook: (id: string) => void
  onViewDetail: (id: string) => void
  onResultOpened: (id: string, score: number) => void
  onContactClick: (id: string, score: number) => void
  debugEnabled?: boolean
  breakdownSimple?: { diagnosis: number; distance: number; time: number; gender: number } | null
  query?: {
    therapistGenderPref?: 'male' | 'female' | 'any'
    issues?: string[]
    language?: string
    wantsInsurance?: boolean
  }
  isBibiaRecommended?: boolean
  cardIndex?: number
}

function TherapistCard({ therapist, onBook, onViewDetail, onResultOpened, onContactClick, debugEnabled, breakdownSimple, query, isBibiaRecommended = false, cardIndex = 0 }: TherapistCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipType, setTooltipType] = useState<'recommendation' | 'availability' | null>(null)
  // Format name - no comma after academic titles like "MUDr." or "Mgr."
  const formatName = (name: string) => {
    if (!name) return 'Bez jména'
    // Remove commas after academic titles
    return name.replace(/\b(MUDr|Mgr|Ing|Bc|PhDr|PhD|Dr|Prof)\.\s*,/g, '$1. ')
  }
  
  const displayName = formatName(therapist.therapist.fullName || 'Bez jména')
  const initials = (therapist.therapist.fullName && typeof therapist.therapist.fullName === 'string')
    ? therapist.therapist.fullName.split(' ').map(s => s?.[0]).filter(Boolean).slice(0, 2).join('')
    : (therapist.therapist.id ? String(therapist.therapist.id).slice(0, 2).toUpperCase() : '??')
  const isOnlineOnly = therapist.meeting_types.length > 0 && therapist.meeting_types.every(t => t === 'online')
  const hasDistanceValue = typeof (therapist as any).distance_km === 'number' && isFinite((therapist as any).distance_km)
  const distanceEstimated = Boolean((therapist as any).distance_estimated)
  const hasDistance = !isOnlineOnly && (hasDistanceValue || distanceEstimated)
  
  // Format distance with comma decimal using cs-CZ locale
  const formatDistance = (km: number) => {
    return new Intl.NumberFormat('cs-CZ', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    }).format(Math.max(0.5, Number(km.toFixed(1)))) + ' km'
  }
  
  const distanceStr = hasDistance
    ? (hasDistanceValue
        ? formatDistance((therapist as any).distance_km)
        : (typeof (therapist as any).distance_km === 'number'
            ? `~${formatDistance((therapist as any).distance_km)}`
            : `~${therapist.therapist.city || (therapist as any).km_hint || ''}`))
    : null
  
  // Get match badge text
  const rawMatchPercent = (therapist as any).matchPercent ?? therapist.match_score
  const hasMatchPercent = typeof rawMatchPercent === 'number' && isFinite(rawMatchPercent)
  const matchPercent = hasMatchPercent ? Math.round(rawMatchPercent) : null
  
  let matchBadgeText: string | null = null
  if (matchPercent !== null) {
    if (matchPercent >= 75) matchBadgeText = 'Vysoká shoda'
    else if (matchPercent >= 55) matchBadgeText = 'Dobrá shoda'
    else matchBadgeText = 'Možná shoda'
  }

  // Get top reasons for "Proč právě on/ona"
  const rawReasonsSource = (therapist as any).rawReasons ?? (therapist as any).reasons ?? []
  const topReasons = pickTopReasonsCs(Array.isArray(rawReasonsSource) ? rawReasonsSource : [], 'card', 3)
  const reasonsList = topReasons.slice(0, 3)
  const genderLabel = therapist.therapist.gender === 'female' ? 'ona' : 'on'

  // Handle card click for analytics
  const handleCardClick = () => {
    onResultOpened(therapist.therapist.id, matchPercent ?? therapist.match_score ?? 0)
  }

  // Determine if this therapist is recommended (high match score)
  const isRecommended = matchPercent !== null && matchPercent >= 75

  // Get badge text - "Doporučeno" for high matches (>= 75%), "Možná shoda" for others with match score
  const badgeText = isRecommended ? 'Doporučeno' : (matchPercent !== null ? 'Možná shoda' : null)

  // Get availability status from centralized system
  const availability = getTherapistAvailabilityStatus(therapist, matchPercent)

  // Mock trust indicator (UI only)
  const getTrustIndicator = (): string | null => {
    // Show trust indicator for high match scores or randomly for some cards
    if (matchPercent !== null && matchPercent >= 75) {
      return 'Ověřeno klienty Bibia'
    } else if (matchPercent !== null && matchPercent >= 55 && cardIndex % 3 === 0) {
      return 'Velmi dobře hodnocený terapeut'
    }
    return null
  }

  const trustIndicator = getTrustIndicator()

  return (
    <div 
      className={`group relative rounded-2xl shadow-sm border-0 p-8 cursor-pointer flex flex-col transition-all duration-250 ease-out ${
        isBibiaRecommended 
          ? 'bg-gradient-to-br from-seafoam-50/40 to-white border border-seafoam-200/30 hover:from-seafoam-50/60 hover:to-white hover:-translate-y-1 hover:shadow-lg' 
          : 'bg-white hover:bg-seafoam-50/30 hover:-translate-y-1 hover:shadow-lg'
      }`}
      onClick={handleCardClick}
      style={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* "Doporučeno Bibia" badge - Top right */}
      {isBibiaRecommended && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-seafoam-200/60 text-seafoam-800 border border-seafoam-300/50 backdrop-blur-sm">
            Doporučeno Bibia
          </span>
        </div>
      )}

      {/* Regular match badge - only show if not Bibia recommended */}
      {!isBibiaRecommended && badgeText && (
        <div className="absolute top-4 right-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-seafoam-100 text-seafoam-700 border border-seafoam-200/50 transition-all duration-250 group-hover:scale-105 group-hover:bg-seafoam-200/80 group-hover:border-seafoam-300/70">
            {badgeText}
          </span>
        </div>
      )}

      {/* Avatar - Significantly larger, prominent at top */}
      <div className="flex justify-center mb-6 mt-2">
        <div className="relative">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-seafoam-100 to-seafoam-200 flex items-center justify-center text-seafoam-700 font-semibold text-2xl md:text-3xl shrink-0 shadow-sm border-2 border-seafoam-100 transition-all duration-250 group-hover:shadow-md group-hover:ring-2 group-hover:ring-seafoam-200/50 group-hover:ring-offset-2 group-hover:ring-offset-transparent">
            {initials}
          </div>
        </div>
      </div>

      {/* Name - Main focus, centered */}
      <div className="text-center mb-3">
        <h3 className="text-xl md:text-2xl font-semibold text-[#1c4a44] mb-2">
          {displayName}
        </h3>
        
        {/* Location - Secondary text, muted */}
        {therapist.therapist.city && (
          <p className="text-sm text-seafoam-600 font-normal">
            {therapist.therapist.city}
            {hasDistance && distanceStr && ` • ${distanceStr}`}
          </p>
        )}
      </div>

      {/* Trust indicator - soft, non-comparative */}
      {trustIndicator && (
        <div className="mb-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-seafoam-700 bg-seafoam-50/50 border border-seafoam-200/30">
            <CheckCircle className="w-3.5 h-3.5 text-seafoam-600" />
            {trustIndicator}
          </span>
        </div>
      )}

      {/* Pill-style labels for specialties/reasons */}
      {reasonsList.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {reasonsList.slice(0, 2).map((reason, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-seafoam-50 text-seafoam-700 border border-seafoam-200/50"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Availability indicator */}
      <div className="mb-4 flex justify-center">
        <AvailabilityBadge availability={availability} size="md" />
      </div>

      {/* Debug overlay - keep for development */}
      {process.env.NODE_ENV !== 'production' && debugEnabled && (
        <DebugOverlay therapist={therapist as any} />
      )}
      

      {/* Tooltip/Modal for secondary action */}
      {showTooltip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTooltip(false)
              setTooltipType(null)
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 border border-seafoam-200/50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1c4a44]">
                {tooltipType === 'recommendation' ? 'Proč doporučujeme' : 'Dostupnost'}
              </h3>
              <button
                onClick={() => {
                  setShowTooltip(false)
                  setTooltipType(null)
                }}
                className="text-seafoam-600 hover:text-seafoam-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-seafoam-700 space-y-2">
              {tooltipType === 'recommendation' ? (
                <p>
                  Tento terapeut má vysokou shodu s vašimi požadavky a je ověřený našimi klienty. 
                  Specializuje se na problémy, které jste uvedli, a má dobré hodnocení.
                </p>
              ) : (
                <p>
                  Aktuální dostupnost se může měnit. Pro přesné informace o volných termínech 
                  kontaktujte terapeuta přímo nebo si zobrazte jeho profil.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setShowTooltip(false)
                  setTooltipType(null)
                }}
                className="bg-seafoam-600 hover:bg-seafoam-700 text-white"
              >
                Rozumím
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Primary CTA - "Zobrazit profil" */}
      <div className="mt-2">
        <Button 
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail(therapist.therapist.id)
          }}
          className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white text-sm font-medium h-10 shadow-sm transition-all duration-250 rounded-lg group-hover:shadow-md group-hover:from-[#257a65] group-hover:to-[#2e8b75]"
        >
          Zobrazit profil
        </Button>
      </div>
    </div>
  )
}

function DebugOverlay({ therapist }: { therapist: any }) {
  const breakdown = therapist.score_breakdown || {}
  const geo = therapist.geo_debug || {}
  const entries = [
    { key: 'diagnosis', label: 'Diagnóza' },
    { key: 'availability', label: 'Dostupnost' },
    { key: 'distance', label: 'Vzdálenost' },
    { key: 'language', label: 'Jazyk' },
    { key: 'prefs', label: 'Preference' },
    { key: 'profile', label: 'Profil' }
  ] as const
  return (
    <div className="mt-2 border border-amber-200 bg-amber-50 rounded-lg p-2">
      <div className="text-xs text-amber-800 font-semibold mb-1">Debug: Detailed Scoring</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-900/90">
        <div>
          <div><span className="font-semibold">gender:</span> {therapist.therapist?.gender || 'n/a'}</div>
          <div><span className="font-semibold">gender_score:</span> {((therapist as any).components?.gender || 0).toFixed(2)}</div>
          <div><span className="font-semibold">problemAreas:</span> {((therapist as any).matched_diagnoses || []).join(', ') || 'none'}</div>
          <div><span className="font-semibold">problem_score:</span> {((therapist as any).score_breakdown?.diagnosis || 0)}</div>
          <div><span className="font-semibold">userLatLng:</span> {geo?.user ? `${geo.user.lat}, ${geo.user.lng ?? geo.user.lon}` : 'n/a'}</div>
          <div><span className="font-semibold">therapistLatLng:</span> {geo?.therapist ? `${geo.therapist.lat}, ${geo.therapist.lng}` : 'n/a'}</div>
        </div>
        <div>
          <div><span className="font-semibold">diag_score:</span> {((therapist as any).score_breakdown?.diagnosis || 0)}</div>
          <div><span className="font-semibold">dist_score:</span> {((therapist as any).score_breakdown?.distance || 0)}</div>
          <div><span className="font-semibold">time_score:</span> {((therapist as any).score_breakdown?.availability || 0)}</div>
          <div><span className="font-semibold">total:</span> {therapist.match_score || 0}</div>
          <div><span className="font-semibold">km:</span> {typeof therapist.distance_km === 'number' ? therapist.distance_km : '—'}</div>
          <div><span className="font-semibold">estimated:</span> {String(therapist.distance_estimated ?? (geo?.estimated ?? false))}</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1"><span className="font-semibold">score_breakdown:</span></div>
        <div className="flex flex-wrap gap-2">
          {entries.map(e => (
            <span key={e.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border text-xs">
              <span className="font-medium">{e.label}:</span>
              <span>{breakdown[e.key] ?? 0}</span>
            </span>
          ))}
        </div>
        {Array.isArray((therapist as any).violatedCriteria) && (therapist as any).violatedCriteria.length > 0 && (
          <div className="mt-2">
            <span className="font-semibold">violated:</span> {(therapist as any).violatedCriteria.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  onExpandRadius: (radius: number) => void
  onToggleOnline: () => void
  onEditQuestionnaire: () => void
  currentRadius?: number
  isOnlineMode?: boolean
}

function EmptyState({ onExpandRadius, onToggleOnline, onEditQuestionnaire, currentRadius = 30, isOnlineMode = false }: EmptyStateProps) {
  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-white to-seafoam-50/40 border border-seafoam-200/50 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-6 bg-seafoam-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-seafoam-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1c4a44] mb-3">
            Zkoušeli jsme vyhledat co nejpřesněji, ale výsledků je málo.
          </h2>
          <p className="text-lg text-seafoam-700 mb-2">
            Můžete zkusit rozšířit okruh, povolit online konzultace nebo upravit vyhledávací kritéria.
          </p>
          <p className="text-sm text-seafoam-600 mb-8">
            Vždy zobrazujeme alespoň 3 blízké shody s vysvětlením, co nesedí.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Expand Radius Buttons */}
            {!isOnlineMode && currentRadius < 100 && (
              <>
                {currentRadius < 50 && (
                  <Button 
                    onClick={() => onExpandRadius(50)}
                    className="px-6 py-3 bg-gradient-to-r from-[#2e8b75] to-[#3da188] text-white rounded-xl font-medium hover:from-[#3da188] hover:to-[#4db59a] transition-all duration-200 shadow-sm"
                  >
                    <Expand className="w-4 h-4 mr-2" />
                    Rozšířit na 50 km
                  </Button>
                )}
                {currentRadius < 75 && (
                  <Button 
                    onClick={() => onExpandRadius(75)}
                    className="px-6 py-3 bg-gradient-to-r from-[#2e8b75] to-[#3da188] text-white rounded-xl font-medium hover:from-[#3da188] hover:to-[#4db59a] transition-all duration-200 shadow-sm"
                  >
                    <Expand className="w-4 h-4 mr-2" />
                    Rozšířit na 75 km
                  </Button>
                )}
                {currentRadius < 100 && (
                  <Button 
                    onClick={() => onExpandRadius(100)}
                    className="px-6 py-3 bg-gradient-to-r from-[#2e8b75] to-[#3da188] text-white rounded-xl font-medium hover:from-[#3da188] hover:to-[#4db59a] transition-all duration-200 shadow-sm"
                  >
                    <Expand className="w-4 h-4 mr-2" />
                    Rozšířit na 100 km
                  </Button>
                )}
              </>
            )}
            
            {/* Toggle Online */}
            <Button 
              onClick={onToggleOnline}
              className="px-6 py-3 bg-gradient-to-r from-[#2e8b75] to-[#3da188] text-white rounded-xl font-medium hover:from-[#3da188] hover:to-[#4db59a] transition-all duration-200 shadow-sm"
            >
              <Laptop className="w-4 h-4 mr-2" />
              {isOnlineMode ? 'Zpět na místní' : 'Povolit online'}
            </Button>
            
            {/* Edit Questionnaire */}
            <Button 
              onClick={onEditQuestionnaire}
              className="px-6 py-3 border-2 border-seafoam-400 text-seafoam-700 rounded-xl font-medium hover:bg-seafoam-50 transition-all duration-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              Nezohledňovat jazyk
            </Button>
            
            {/* Additional fallback options */}
            <Button 
              onClick={() => {/* TODO: Implement ignore insurance */}}
              className="px-6 py-3 border-2 border-seafoam-200 text-seafoam-600 rounded-xl font-medium hover:bg-seafoam-50/50 transition-all duration-200"
            >
              Nezohledňovat pojišťovnu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const {
    loading,
    hasResults,
    empty,
    error,
    results,
    query,
    totalCount,
    fallbackUsed,
    fallbackLevel,
    setQueryParam,
    expandRadius,
    toggleOnline,
    updateSort,
    toggleDebug,
    debugEnabled,
    normalizedInputs,
    normalizedQuery,
    removeFilter,
    logResultOpened,
    logContactClick,
    search
  } = useSearchResults()

  // Seed search from /results?… URL params (one-time on mount)
  useEffect(() => {
    if (!searchParams) return
    const city = searchParams?.get('city') || undefined
    const practice = searchParams?.get('practice') || undefined
    const conditions = searchParams?.get('conditions') || undefined
    const hasDiagnosis = searchParams?.get('hasDiagnosis') || undefined
    const time = searchParams?.get('time') || undefined
    const day = searchParams?.get('day') || undefined
    const languages = searchParams?.get('languages') || undefined
    const insurance = searchParams?.get('insurance') || undefined
    const ageGroups = searchParams?.get('ageGroups') || undefined
    const therapistGender = searchParams?.get('therapistGender') || undefined

    const custom: any = {}
    if (city) custom.city = city
    if (practice) custom.meetingType = practice
    if (conditions) custom.issues = conditions.split(',')
    // hasDiagnosis=false → skip diagnosis; rely on issues only
    if (time) custom.time = time
    if (day) custom.day = day
    if (languages) custom.language = languages
    if (insurance) custom.wantsInsurance = insurance !== 'self-pay'
    if (ageGroups) custom.ageGroup = ageGroups
    if (therapistGender) {
      // Map Czech gender values to English
      const genderMapping: Record<string, 'male' | 'female' | 'any'> = {
        'muz': 'male',
        'zena': 'female',
        'nezalezi': 'any',
        'male': 'male',
        'female': 'female',
        'any': 'any'
      }
      custom.therapistGenderPref = genderMapping[therapistGender] || 'any'
    }
    if (searchParams?.get('strictGender') === 'true') custom.strictGender = true

    if (Object.keys(custom).length > 0) {
      console.log('🔍 [RESULTS CLIENT] Applying custom query:', custom)
      // Ensure sort is consistent with API default
      updateSort('best')
      // Only trigger search if we have significant changes that differ from the initial query
      // This prevents duplicate searches when the useSearchResults hook has already searched
      const hasSignificantChanges = Object.keys(custom).some(key => {
        const currentValue = query[key as keyof typeof query]
        const newValue = custom[key]
        return currentValue !== newValue
      })
      
      // Always trigger search on mount with custom params
      console.log('🔍 [RESULTS CLIENT] Calling search with:', custom)
      ;(search as any)(custom)
    }
    // Debug query param toggle (internal only)
    const dbg = searchParams?.get('debug')
    if (dbg === '1' && process.env.NODE_ENV !== 'production') {
      toggleDebug()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get search orchestrator state for geocoding error handling
  const shouldSuggestOnlineMode = false // Simplified for now

  const handleBook = (id: string) => {
    // TODO: Implement booking flow
    alert(`Rezervace pro terapeuta ${id} - modal stub`)
  }

  const handleViewDetail = (id: string) => {
    router.push(`/therapists/${id}`)
  }

  const handleEditQuestionnaire = () => {
    // Preserve current search criteria in localStorage for rehydration
    const currentAnswers = {
      location: query.lat && query.lon ? {
        coordinates: { lat: query.lat, lng: query.lon },
        city: query.city
      } : undefined,
      conditions: query.issues || [],
      availability: query.timeFit ? [query.timeFit] : [],
      practice: query.meetingType ? [query.meetingType] : [],
      languages: query.language ? [query.language] : [],
      radius: query.radius || 30,
      onlineOnly: query.onlineOnly || false
    }
    
    localStorage.setItem('bibiaQuestionnaireResults', JSON.stringify({
      answers: currentAnswers,
      timestamp: Date.now()
    }))
    
    router.push(ROUTES.questionnaire)
  }

  // Grouped results integration - only fetch if legacy match is enabled
  const [grouped, setGrouped] = useState<{ best: Array<{id:string; score:number; breakdown:{diagnosis:number; distance:number; time:number; gender:number}}>; medium: Array<{id:string; score:number; breakdown:{diagnosis:number; distance:number; time:number; gender:number}}>; low: Array<{id:string; score:number; breakdown:{diagnosis:number; distance:number; time:number; gender:number}}> } | null>(null)
  useEffect(() => {
    // Only fetch grouped results if legacy match is enabled
    if (!SHOW_LEGACY_MATCH) {
      setGrouped(null)
      return
    }
    
    // Trigger grouped fetch when query has at least a city or issues; keep independent of main search flow
    const run = async () => {
      try {
        const body: any = {
          grouped: true,
          city: query.city || '',
          diagnosisIds: (query.issues || []),
          when: { day: (query.day || ''), timeSlot: (query.time || '') },
          genderPref: (query.therapistGenderPref || 'any')
        }
        const res = await fetch('/api/searchTherapists?debug=1', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (data && data.best && data.medium && data.low) {
          setGrouped({ best: data.best, medium: data.medium, low: data.low })
        }
      } catch {}
    }
    run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.city, JSON.stringify(query.issues || []), query.day, query.time, query.therapistGenderPref])

  function fillAtLeast3<T>(a: T[], b: T[], c: T[]): T[] {
    const out: T[] = []
    const used = new Set<any>()
    const push = (arr: T[]) => { for (const x of arr) { const key = (x as any).id ?? JSON.stringify(x); if (out.length >= 3) break; if (used.has(key)) continue; used.add(key); out.push(x) } }
    push(a); if (out.length < 3) push(b); if (out.length < 3) push(c)
    return out.slice(0, 3)
  }

  // Filter therapists by search query (client-side filtering)
  const filteredResults = React.useMemo(() => {
    if (!results || !hasResults || !searchQuery.trim()) return results
    const queryLower = searchQuery.toLowerCase().trim()
    const filtered = toArray(results).filter((ther: any) => {
      const name = ther.therapist?.fullName || ''
      const city = ther.therapist?.city || ''
      return name.toLowerCase().includes(queryLower) || city.toLowerCase().includes(queryLower)
    })
    return filtered
  }, [results, hasResults, searchQuery])

  return (
    <section className="relative pt-4 pb-16 md:pt-6 md:pb-20 bg-gradient-to-br from-[#1c4a44] via-[#2e8b75] to-[#3da188] min-h-screen">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Centered Panel */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header Row */}
          <div className="px-6 py-6 border-b border-seafoam-100/50 bg-gradient-to-r from-seafoam-50/30 to-white">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Title + Count */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1c4a44]">
                  Výsledky vyhledávání
                </h1>
                {hasResults && (
                  <p className="text-sm text-seafoam-700 mt-1.5">
                    Nalezeno {totalCount}
                    {fallbackUsed && fallbackLevel && (
                      <span className="ml-2 text-amber-600">
                        (rozšířené vyhledávání)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Right: Search + View Toggle */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Hledat terapeuta…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 border-seafoam-200/60 focus:border-seafoam-400 focus:ring-seafoam-300 bg-white/80"
                  />
                </div>

                {/* View Toggle Buttons */}
                <div className="flex items-center gap-1 border border-seafoam-200/60 rounded-lg p-1 bg-white/80">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-seafoam-100 text-seafoam-700'
                        : 'text-seafoam-400 hover:text-seafoam-600 hover:bg-seafoam-50/50'
                    }`}
                    aria-label="Mřížka"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-seafoam-100 text-seafoam-700'
                        : 'text-seafoam-400 hover:text-seafoam-600 hover:bg-seafoam-50/50'
                    }`}
                    aria-label="Seznam"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="px-6 py-4 border-b border-seafoam-100/50 bg-seafoam-50/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {/* Location */}
                {query.city && (
                  <FilterChip
                    label={query.city}
                    type="location"
                    onRemove={() => removeFilter('city')}
                  />
                )}
                {query.radius && (
                  <FilterChip
                    label={`${query.radius} km`}
                    type="location"
                    onRemove={() => removeFilter('radius')}
                  />
                )}
                
                {/* Conditions */}
                {(query.issues || []).map((condition, i) => (
                  <FilterChip
                    key={i}
                    label={condition}
                    type="condition"
                    onRemove={() => {
                      const newConditions = (query.issues || []).filter(c => c !== condition)
                      if (newConditions && newConditions.length > 0) {
                        setQueryParam('issues', newConditions)
                        search({ issues: newConditions })
                      } else {
                        removeFilter('conditions')
                      }
                    }}
                  />
                ))}
                
                {/* Availability */}
                {(query.timeFit ? [query.timeFit] : []).map((avail, i) => (
                  <FilterChip
                    key={i}
                    label={avail}
                    type="availability"
                    onRemove={() => {
                      const base = query.timeFit ? [query.timeFit] : []
                      const newAvailability = base.filter(a => a !== avail)
                      if (newAvailability && newAvailability.length > 0) {
                        setQueryParam('timeFit', newAvailability[0])
                        search({ timeFit: newAvailability[0] })
                      } else {
                        removeFilter('availability')
                      }
                    }}
                  />
                ))}
                
                {/* Practice */}
                {(query.meetingType ? [query.meetingType] : []).map((practice, i) => (
                  <FilterChip
                    key={i}
                    label={practice}
                    type="practice"
                    onRemove={() => {
                      const base = query.meetingType ? [query.meetingType] : []
                      const newPractice = base.filter(p => p !== practice)
                      if (newPractice && newPractice.length > 0) {
                        setQueryParam('meetingType', newPractice[0] as any)
                        search({ meetingType: newPractice[0] as any })
                      } else {
                        removeFilter('practice')
                      }
                    }}
                  />
                ))}
                
                {/* Languages */}
                {(query.language ? [query.language] : []).map((lang, i) => (
                  <FilterChip
                    key={i}
                    label={lang}
                    type="language"
                    onRemove={() => {
                      const base = query.language ? [query.language] : []
                      const newLanguages = base.filter(l => l !== lang)
                      if (newLanguages && newLanguages.length > 0) {
                        setQueryParam('language', newLanguages[0])
                        search({ language: newLanguages[0] })
                      } else {
                        removeFilter('languages')
                      }
                    }}
                  />
                ))}
                
                {/* Online Mode */}
                {query.onlineOnly && (
                  <FilterChip
                    label="Online"
                    type="practice"
                    onRemove={toggleOnline}
                  />
                )}
                
                {/* Strict Gender Filter - only show when strictGender === true */}
                {query.therapistGenderPref && query.therapistGenderPref !== 'any' && query.strictGender === true && (
                  <FilterChip
                    label={`Přísné pohlaví: ${query.therapistGenderPref === 'female' ? 'žena' : 'muž'}`}
                    type="practice"
                    onRemove={() => {
                      // When removed, set strictGender = false (does NOT affect genderPreference)
                      setQueryParam('strictGender', false)
                      // Update URL params
                      if (searchParams) {
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('strictGender')
                        router.push(`/results?${params.toString()}`, { scroll: false })
                      }
                      // Trigger new search with updated query
                      search({ strictGender: false })
                    }}
                  />
                )}
                
                {/* "Allow other gender" chip - only show when strictGender === true */}
                {query.therapistGenderPref && query.therapistGenderPref !== 'any' && query.strictGender === true && (
                  <FilterChip
                    label="Povolit jiné pohlaví"
                    type="practice"
                    onRemove={() => {
                      // When clicked, set strictGender = false (allow other gender)
                      // This does NOT affect genderPreference (therapistGenderPref)
                      setQueryParam('strictGender', false)
                      
                      // Update URL params to keep them in sync
                      if (searchParams) {
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('strictGender')
                        router.push(`/results?${params.toString()}`, { scroll: false })
                      }
                      
                      // Trigger new search with updated strictGender
                      search({ strictGender: false })
                    }}
                  />
                )}
                
                {/* Barrier-free filter */}
                {query.barrierFree && (
                  <FilterChip
                    label="Bezbariérový přístup"
                    type="practice"
                    onRemove={() => {
                      setQueryParam('barrierFree', false)
                      if (searchParams) {
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('barrierFree')
                        router.push(`/results?${params.toString()}`, { scroll: false })
                      }
                      search({ barrierFree: false })
                    }}
                  />
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    removeFilter('languages')
                    removeFilter('availability')
                    removeFilter('practice')
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-seafoam-300 text-seafoam-700 hover:bg-seafoam-50"
                >
                  Reset filtrů
                </button>
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    onClick={toggleDebug}
                    className={`text-xs px-3 py-1 rounded-full border ${debugEnabled ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Debug
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sort Controls - inside panel */}
          {hasResults && (
            <div className="px-6 py-3 border-b border-seafoam-100/50 bg-white/50">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-seafoam-700">Řazení:</span>
                <select
                  value={query.sort || 'best'}
                  onChange={(e) => updateSort(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-seafoam-400 focus:border-seafoam-400 bg-white text-sm text-gray-700"
                >
                  <option value="best">Nejlepší shoda</option>
                  <option value="nearest">Vzdálenost</option>
                  <option value="soonest">Nejbližší termín</option>
                </select>
                {process.env.NODE_ENV !== 'production' && debugEnabled && (
                  <GeoTuningPanel />
                )}
              </div>
            </div>
          )}

          {/* Error Display - inside panel */}
          {error && (
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-3 text-red-800">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Chyba při vyhledávání</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  {shouldSuggestOnlineMode && (
                    <div className="mt-3">
                      <p className="text-sm text-red-600 mb-2">
                        Zkuste upřesnit vaši polohu nebo využijte online konzultace.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(ROUTES.questionnaire)}
                          className="text-red-700 border-red-300 hover:bg-red-50"
                        >
                          Upravit dotazník
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOnline()}
                          className="text-red-700 border-red-300 hover:bg-red-50"
                        >
                          Zkusit online
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content - inside panel */}
          <main className="px-6 py-6">
        {/* Compact query recap */}
        {hasResults && (
          <div className="mb-6 text-sm text-seafoam-700 bg-seafoam-50/30 rounded-lg px-4 py-2.5 border border-seafoam-100/50">
            {(() => {
              const g = (normalizedInputs && (normalizedInputs as any).therapistGenderPref) || query.therapistGenderPref || 'any'
              const gLabel = g === 'female' || g === 'žena' ? 'žena' : g === 'male' || g === 'muž' ? 'muž' : 'libovolné'
              const dxLabel = (normalizedInputs && (normalizedInputs as any).diagnosis && (normalizedInputs as any).diagnosis.canonicalId) || (query.diagnosis && query.diagnosis.canonicalId) || '—'
              const slot = query.timeFit || '—'
              const rad = `${query.radius || 20} km`
              return (
                <span>
                  Hledám: {gLabel} • Problém: {dxLabel} • Čas: {slot} • Dojezd: {rad}
                </span>
              )
            })()}
          </div>
        )}

        {/* Normalized query header (debug only) */}
        {process.env.NODE_ENV !== 'production' && debugEnabled && normalizedInputs && (
          <div className="mb-4 border border-amber-200 bg-amber-50 rounded-xl p-3 text-[12px] text-amber-800">
            <div className="font-semibold mb-1">Normalized Query</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div>city: {normalizedInputs.location?.city || ''}</div>
                <div>meetingType: {normalizedInputs.meetingType || ''}</div>
                <div>language: {normalizedInputs.language || ''}</div>
              </div>
              <div>
                <div>gender: {(() => { const g = normalizedInputs.therapistGenderPref || 'any'; return g==='female'?'žena': g==='male'?'muž':'libovolné' })()}</div>
                <div>time/day: {JSON.stringify({ time: (normalizedInputs as any).timeBuckets, day: (normalizedInputs as any).dayBuckets })}</div>
                {(results as any) && (results as any).fallback && (results as any).fallback.reason && (
                  <div>fallback.reason: {(results as any).fallback.reason}</div>
                )}
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8 md:gap-10`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white shadow-sm border-0 p-8 animate-pulse">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-seafoam-200 shrink-0 mb-6" />
                  <div className="w-full space-y-3">
                    <div className="h-6 bg-seafoam-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-seafoam-100 rounded w-1/2 mx-auto" />
                    <div className="flex gap-2 justify-center mt-4">
                      <div className="h-6 bg-seafoam-100 rounded-full w-24" />
                      <div className="h-6 bg-seafoam-100 rounded-full w-24" />
                    </div>
                    <div className="h-10 bg-seafoam-200 rounded-lg w-full mt-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasResults ? (
          (() => {
            // Normal mode with tiers + grouped match sections
            const groupedBest = grouped ? fillAtLeast3(grouped.best || [], grouped.medium || [], grouped.low || []) : []
            const groupedMedium = grouped ? fillAtLeast3(grouped.medium || [], grouped.low || [], grouped.best || []) : []
            const groupedLow = grouped ? fillAtLeast3(grouped.low || [], grouped.medium || [], grouped.best || []) : []
            const GroupedSection = ({ title, items }: { title: string; items: Array<{id:string; score:number; breakdown:{diagnosis:number; distance:number; time:number; gender:number}}> }) => (
              <section className="mb-12">
                <h2 className="text-xl md:text-2xl font-semibold text-[#1c4a44] mb-6">{title}</h2>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8 md:gap-10`}>
                  {items.slice(0,3).map((itm, idx) => {
                    // Synthesize minimal TherapistMatch shape for card
                    const fake: any = {
                      therapist: { id: itm.id, fullName: itm.id, city: '' },
                      meeting_types: [],
                      languages: [],
                      age_supported: [],
                      supports_insurance: false,
                      match_score: Math.round(itm.score * 100)
                    }
                    return (
                      <TherapistCard
                        key={itm.id}
                        therapist={fake}
                        onBook={handleBook}
                        onViewDetail={handleViewDetail}
                        onResultOpened={logResultOpened}
                        onContactClick={logContactClick}
                        debugEnabled={false}
                        breakdownSimple={itm.breakdown}
                        query={query}
                        isBibiaRecommended={idx === 0}
                        cardIndex={idx}
                      />
                    )
                  })}
                </div>
              </section>
            )
            // Use filtered results if search query is active
            const displayResults = searchQuery.trim() ? filteredResults : results
            const tier1 = toArray(displayResults).filter((r: any) => r.tier === 1)
            const tier2 = toArray(displayResults).filter((r: any) => r.tier === 2)
            const tier3 = toArray(displayResults).filter((r: any) => r.tier === 3)
            const tier4 = tier1.length > 0 ? [] : toArray(displayResults).filter((r: any) => r.tier === 4)
            const Section = ({ title, items, defaultBadge }: { title: string; items: any[]; defaultBadge?: string }) => (
              items.length > 0 ? (
                <div className="mb-12">
                  <h2 className="text-xl md:text-2xl font-semibold text-[#1c4a44] mb-6">{title}</h2>
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8 md:gap-10`}>
                    {items.map((ther: any, idx: number) => {
                      // Mark top 1-2 cards as "Doporučeno Bibia" based on match score
                      const rawMatchPercent = ther.matchPercent ?? ther.match_score
                      const hasMatchPercent = typeof rawMatchPercent === 'number' && isFinite(rawMatchPercent)
                      const matchPercent = hasMatchPercent ? Math.round(rawMatchPercent) : null
                      const isBibiaRecommended = matchPercent !== null && matchPercent >= 75 && idx < 2
                      
                      return (
                        <TherapistCard
                          key={ther.therapist.id}
                          therapist={ther}
                          onBook={handleBook}
                          onViewDetail={handleViewDetail}
                          onResultOpened={logResultOpened}
                          onContactClick={logContactClick}
                          debugEnabled={debugEnabled}
                          query={query}
                          isBibiaRecommended={isBibiaRecommended}
                          cardIndex={idx}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : null
            )
            return (
              <>
                {tier1.length === 0 && (
                  <div className="mb-8 p-5 rounded-xl border border-amber-200/60 bg-amber-50/50 text-amber-800 shadow-sm">
                    {(normalizedInputs && (normalizedInputs as any).therapistGenderPref !== 'any') ? (
                      <span>Nenašli jsme fyzioterapeutky v zadaném okruhu. Zobrazujeme i další terapeuty.</span>
                    ) : (
                      <span>V okolí {query.city || 'vámi zadaného místa'} jsme nenašli přesnou shodu. Nabízíme vám alternativy:</span>
                    )}
                  </div>
                )}
                <Section title="Lokální shody" items={tier1} />
              </>
            )
          })()
        ) : empty ? (
          <EmptyState
            onExpandRadius={expandRadius}
            onToggleOnline={toggleOnline}
            onEditQuestionnaire={handleEditQuestionnaire}
            currentRadius={query.radius}
            isOnlineMode={query.onlineOnly}
          />
        ) : null}
          </main>
        </div>
      </div>
    </section>
  )
}

function GeoTuningPanel() {
  const [decay, setDecay] = useState<string>('')
  const [bonus, setBonus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/geo-tuning', { method: 'GET' })
      const data = await res.json()
      if (typeof data.distanceDecayKm === 'number') setDecay(String(data.distanceDecayKm))
      if (typeof data.homeVisitBonus === 'number') setBonus(String(data.homeVisitBonus))
    } catch (e) {
      setMsg('Load failed')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    try {
      setLoading(true)
      setMsg('')
      const body: any = {}
      if (decay) body.distanceDecayKm = Number(decay)
      if (bonus) body.homeVisitBonus = Number(bonus)
      const res = await fetch('/api/admin/geo-tuning', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        setMsg(`Applied: decay=${data.distanceDecayKm}, bonus=${data.homeVisitBonus}`)
      } else {
        setMsg('Save failed')
      }
    } catch (e) {
      setMsg('Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ml-auto flex items-center gap-2 text-xs">
      <button onClick={load} className="px-2 py-1 border border-amber-300 rounded">Load geo</button>
      <div className="flex items-center gap-1">
        <span>decayKm</span>
        <input value={decay} onChange={(e) => setDecay(e.target.value)} className="w-16 px-2 py-1 border rounded" />
      </div>
      <div className="flex items-center gap-1">
        <span>homeBonus</span>
        <input value={bonus} onChange={(e) => setBonus(e.target.value)} className="w-16 px-2 py-1 border rounded" />
      </div>
      <button onClick={save} disabled={loading} className="px-2 py-1 border border-amber-300 rounded bg-amber-50">Apply</button>
      {msg && <span className="text-amber-700 ml-2">{msg}</span>}
    </div>
  )
}
