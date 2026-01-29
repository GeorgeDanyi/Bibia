import { normalizePlace } from '@/lib/services/normalizePlace'

export type TherapistLike = {
  id: string
  city?: string
  postalCode?: string
  address?: string
  lat?: number
  lng?: number
}

export type GeoResult = { lat: number; lng: number; estimated: boolean }

export async function ensureTherapistCoords<T extends TherapistLike>(t: T): Promise<T & GeoResult> {
  if (Number.isFinite(t.lat as any) && Number.isFinite(t.lng as any)) {
    return { ...(t as any), lat: t.lat as number, lng: t.lng as number, estimated: false }
  }
  if (t.address) {
    const res = await normalizePlace(t.address)
    return { ...(t as any), lat: res.lat, lng: res.lng, estimated: res.source !== 'saas' }
  }
  const res = await normalizePlace({ city: t.city || '', psc: t.postalCode })
  return { ...(t as any), lat: res.lat, lng: res.lng, estimated: true }
}
