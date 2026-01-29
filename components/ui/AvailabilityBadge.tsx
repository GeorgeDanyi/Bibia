/**
 * Availability Badge Component
 * 
 * Reusable UI component for displaying therapist availability status.
 * Can be used in therapist cards, profile pages, and other locations.
 * 
 * All text is in Czech as per product requirements.
 */

import React from 'react'
import { Clock } from 'lucide-react'
import type { AvailabilityStateConfig } from '@/lib/constants/availability-states'

interface AvailabilityBadgeProps {
  availability: AvailabilityStateConfig
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

/**
 * Availability Badge - Displays availability status with Czech label
 */
export function AvailabilityBadge({
  availability,
  size = 'md',
  showIcon = true,
  className = ''
}: AvailabilityBadgeProps) {
  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1.5 gap-1.5',
    lg: 'text-sm px-4 py-2 gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-normal ${availability.color} ${availability.bgColor} border border-current/20 ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Clock className={iconSizes[size]} />}
      {availability.label}
    </span>
  )
}

/**
 * Export default for convenience
 */
export default AvailabilityBadge





