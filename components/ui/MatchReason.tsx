"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, Star, MapPin, Clock, Users } from "lucide-react"

export interface MatchReasonProps {
  reason: string
  type: 'diagnosis' | 'availability' | 'distance' | 'rating' | 'experience' | 'language'
  strength: 'high' | 'medium' | 'low'
  className?: string
}

const typeConfig = {
  diagnosis: {
    icon: CheckCircle,
    label: 'Diagnóza',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  availability: {
    icon: Clock,
    label: 'Dostupnost',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  distance: {
    icon: MapPin,
    label: 'Vzdálenost',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  rating: {
    icon: Star,
    label: 'Hodnocení',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  experience: {
    icon: Users,
    label: 'Zkušenosti',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  language: {
    icon: CheckCircle,
    label: 'Jazyk',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
}

const strengthStyles = {
  high: 'opacity-100',
  medium: 'opacity-80',
  low: 'opacity-60'
}

export function MatchReason({ reason, type, strength, className }: MatchReasonProps) {
  const config = typeConfig[type]
  const Icon = config.icon
  
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
        config.bgColor,
        config.borderColor,
        config.color,
        strengthStyles[strength],
        className
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{reason}</span>
      {strength === 'high' && (
        <div className="w-2 h-2 rounded-full bg-current opacity-60" />
      )}
    </div>
  )
}

export default MatchReason


