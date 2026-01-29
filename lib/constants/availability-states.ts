/**
 * Availability States - Centralized source of truth
 * 
 * This file defines the three availability states used throughout the Bibia platform.
 * It prepares the foundation for future calendar integration.
 * 
 * All UI text is in Czech as per product requirements.
 */

/**
 * Availability state enum
 */
export enum AvailabilityState {
  AVAILABLE = 'AVAILABLE',
  LIMITED = 'LIMITED',
  FULL = 'FULL'
}

/**
 * Availability state configuration
 */
export interface AvailabilityStateConfig {
  state: AvailabilityState
  label: string // Czech label for UI
  color: string // Tailwind text color class
  bgColor: string // Tailwind background color class
  borderColor: string // Tailwind border color class
}

/**
 * Availability states with Czech labels and styling
 */
export const AVAILABILITY_STATES: Record<AvailabilityState, AvailabilityStateConfig> = {
  [AvailabilityState.AVAILABLE]: {
    state: AvailabilityState.AVAILABLE,
    label: 'Má volné termíny',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  [AvailabilityState.LIMITED]: {
    state: AvailabilityState.LIMITED,
    label: 'Omezená dostupnost',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  [AvailabilityState.FULL]: {
    state: AvailabilityState.FULL,
    label: 'Momentálně plno',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
}

/**
 * Get availability state configuration
 */
export function getAvailabilityStateConfig(state: AvailabilityState): AvailabilityStateConfig {
  return AVAILABILITY_STATES[state]
}

/**
 * Get all availability states (for future use in filters, etc.)
 */
export function getAllAvailabilityStates(): AvailabilityStateConfig[] {
  return Object.values(AVAILABILITY_STATES)
}





