"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { MapPin, Clock, Globe, User } from "lucide-react"

export interface HeaderStripProps {
  location?: string
  radius?: number
  diagnosis?: string[]
  timePreferences?: string[]
  languages?: string[]
  onlineOnly?: boolean
  className?: string
}

const timeLabelMap: Record<string, string> = {
  morning: 'ráno',
  lateMorning: 'dopoledne', 
  afternoon: 'odpoledne',
  evening: 'večer',
  weekend: 'víkend',
  asap: 'co nejdřív'
}

const languageLabels: Record<string, string> = {
  cs: 'čeština',
  en: 'angličtina',
  de: 'němčina',
  ru: 'ruština',
  uk: 'ukrajinština',
  sk: 'slovenština'
}

export function HeaderStrip({ 
  location, 
  radius, 
  diagnosis, 
  timePreferences, 
  languages,
  onlineOnly,
  className 
}: HeaderStripProps) {
  const parts: string[] = []
  
  // Location or Online
  if (onlineOnly) {
    parts.push('Online konzultace')
  } else if (location && radius) {
    parts.push(`Hledám v: ${location} +${radius} km`)
  } else if (location) {
    parts.push(`Hledám v: ${location}`)
  }
  
  // Diagnosis
  if (diagnosis && diagnosis.length > 0) {
    parts.push(`Diagnóza: ${diagnosis.join(', ')}`)
  }
  
  // Time preferences
  if (timePreferences && timePreferences.length > 0) {
    const timeLabelsMapped = timePreferences.map(t => timeLabelMap[t] || t).join('/')
    parts.push(`Čas: ${timeLabelsMapped}`)
  }
  
  // Languages
  if (languages && languages.length > 0) {
    const langLabels = languages.map(l => languageLabels[l] || l).join(', ')
    parts.push(`Jazyk: ${langLabels} (prefer)`)
  }
  
  if (parts.length === 0) {
    return null
  }
  
  return (
    <div className={cn("bg-seafoam-50 border-b border-seafoam-200 px-6 py-3", className)}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-seafoam-800">
          {onlineOnly ? (
            <>
              <span className="font-medium">Online konzultace</span>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Všichni terapeuti</span>
              </div>
            </>
          ) : (
            <>
              <span className="font-medium">Hledám v:</span>
              <div className="flex items-center gap-1">
                {location && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>{location}</span>
                  </>
                )}
                {radius && (
                  <span className="text-seafoam-600">+{radius} km</span>
                )}
              </div>
            </>
          )}
          
          {diagnosis && diagnosis.length > 0 && (
            <>
              <span className="text-seafoam-500">•</span>
              <span className="font-medium">Diagnóza:</span>
              <span>{diagnosis.join(', ')}</span>
            </>
          )}
          
          {timePreferences && timePreferences.length > 0 && (
            <>
              <span className="text-seafoam-500">•</span>
              <span className="font-medium">Čas:</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timePreferences.map(t => timeLabelMap[t] || t).join('/')}</span>
              </div>
            </>
          )}
          
          {languages && languages.length > 0 && (
            <>
              <span className="text-seafoam-500">•</span>
              <span className="font-medium">Jazyk:</span>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{languages.map(l => languageLabels[l] || l).join(', ')}</span>
                <span className="text-seafoam-600 text-xs">(prefer)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default HeaderStrip
