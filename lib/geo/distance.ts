import { canonicalizeCity } from '@/lib/geo/cityIndex'
import { CZ_CITIES } from '@/data/cz_cities'
import { type TherapistNormalized, type MeetingMode } from '@/lib/types/therapist'

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const DISTANCE_BANDS_KM = [3, 10, 25, 50, 100] as const

function cityCoords(city: string): { lat: number; lon: number } | null {
  const hit = CZ_CITIES.find(c => c.city === city)
  if (!hit) return null
  return { lat: hit.lat, lon: hit.lon }
}

export function nearestClinicKm(clientLat: number, clientLon: number, locs: { lat: number; lon: number }[]): number | null {
  const list = (locs || [])
    .filter(l => Number.isFinite((l as any)?.lat) && Number.isFinite((l as any)?.lon))
    .map(l => haversineKm(clientLat, clientLon, (l as any).lat, (l as any).lon))
    .filter(Number.isFinite) as number[]
  const km = list.length ? Math.min(...list) : null
  if (km === null) {
    // No valid clinic coordinates; log for diagnostics
    console.warn('[distance] nearestClinicKm: no valid clinic coordinates for therapist locations')
  }
  return km
}

export function computeEffectiveDistance(params: {
  clientCity: string
  therapist: TherapistNormalized
  meetingMode: MeetingMode
}): { km: number | null; allowed: boolean } {
  const { clientCity, therapist, meetingMode } = params
  
  // Online: no distance calculation, not considered local matches
  if (meetingMode === 'online') return { km: null, allowed: true }

  const clientCanonical = canonicalizeCity(clientCity)
  if (!clientCanonical) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[geo] Client city not canonicalizable: ${clientCity}`)
    }
    return { km: null, allowed: false }
  }
  
  const client = cityCoords(clientCanonical.city)
  if (!client) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[geo] No coordinates for client city: ${clientCanonical.city}`)
    }
    return { km: null, allowed: false }
  }

  let result: { km: number | null; allowed: boolean }
  
  if (meetingMode === 'clinic') {
    // Clinic: always take nearest valid location vs client city centroid
    const km = nearestClinicKm(client.lat, client.lon, (therapist.locations as any) || [])
    if (km === null) {
      // No valid coordinates - reject for in-person
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[geo] REJECTED clinic therapist ${therapist.id}: missing valid coordinates`)
      }
      result = { km: null, allowed: false }
    } else {
      result = { km, allowed: true }
    }
  } else if (meetingMode === 'home_visit') {
    // Home visit: evaluate service radius or service areas
    const radius = therapist.service_radius_km ?? 0
    const serviceAreas = therapist.service_areas || []
    const withinServiceArea = serviceAreas.some(area => {
      const areaCanonical = canonicalizeCity(area)
      return areaCanonical?.city === clientCanonical.city
    })
    
    if (withinServiceArea) {
      // If serves the area, calculate distance to base city
      const baseCity = cityCoords(therapist.base_city)
      if (baseCity) {
        const km = haversineKm(client.lat, client.lon, baseCity.lat, baseCity.lon)
        result = { km, allowed: true }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[geo] REJECTED home_visit therapist ${therapist.id}: no base city coordinates`)
        }
        result = { km: null, allowed: false }
      }
    } else if (radius > 0) {
      // Check if within service radius from any valid location
      const validLocations = (therapist.locations || []).filter((l: any) => 
        Number.isFinite(l?.lat) && Number.isFinite(l?.lon)
      )
      
      if (validLocations.length === 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[geo] REJECTED home_visit therapist ${therapist.id}: no valid locations for radius check`)
        }
        result = { km: null, allowed: false }
      } else {
        // Find minimum distance to any valid location
        let minKm = Infinity
        for (const loc of validLocations) {
          const km = haversineKm(client.lat, client.lon, (loc as any).lat, (loc as any).lon)
          minKm = Math.min(minKm, km)
        }
        
        if (minKm <= radius) {
          result = { km: minKm, allowed: true }
        } else {
          result = { km: minKm, allowed: false }
        }
      }
    } else {
      // No service area and no radius - reject
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[geo] REJECTED home_visit therapist ${therapist.id}: no service area and no radius`)
      }
      result = { km: null, allowed: false }
    }
  } else {
    // Unknown meeting mode
    result = { km: null, allowed: false }
  }

  // Mini-log for dev/test to immediately show success and valid points
  if (process.env.NODE_ENV !== 'production') {
    const validSites = (therapist.locations || []).filter((l: any) => Number.isFinite(l?.lat) && Number.isFinite(l?.lon)).length
    const modes = (therapist.meeting_modes || []).join(',')
    console.log(`[geo] id=${therapist.id} modes=${modes} validSites=${validSites} km=${result.km} allowed=${result.allowed}`)
  }

  return result
}


