import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export haversine utilities
export { haversineKm, haversineKmRounded, isWithinDistance } from "./utils/haversine"
