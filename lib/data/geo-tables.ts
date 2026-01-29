// Offline, canonical geo tables for proximity logic (WGS-84 lat/lon)

export type CitySlug = string

export interface CityCoord {
  slug: CitySlug
  display_name: string
  lat: number
  lon: number
  region: string
  synonyms: string[]
}

export interface ClinicCoord {
  slug: string
  display_name: string
  lat: number
  lon: number
  city_slug: CitySlug
  address?: string
}

// Mandatory: ~50 cities; start with initial seed, extend over time.
// All coordinates are WGS-84.
export const CITY_COORDS: CityCoord[] = [
  {
    slug: 'praha',
    display_name: 'Praha',
    lat: 50.0755,
    lon: 14.4378,
    region: 'Hlavní město Praha',
    synonyms: ['prague', 'hlavni mesto praha', 'praha 1', 'praha 2']
  },
  {
    slug: 'brno',
    display_name: 'Brno',
    lat: 49.1951,
    lon: 16.6068,
    region: 'Jihomoravský',
    synonyms: []
  },
  {
    slug: 'ostrava',
    display_name: 'Ostrava',
    lat: 49.8209,
    lon: 18.2625,
    region: 'Moravskoslezský',
    synonyms: []
  },
  {
    slug: 'plzen',
    display_name: 'Plzeň',
    lat: 49.7384,
    lon: 13.3736,
    region: 'Plzeňský',
    synonyms: ['plzen', 'pilsen']
  },
  {
    slug: 'olomouc',
    display_name: 'Olomouc',
    lat: 49.5938,
    lon: 17.2509,
    region: 'Olomoucký',
    synonyms: []
  },
  // TODO: extend to ~50 cities/large towns covering all regions
]

// Optional: known clinic coordinates (providers can map to these slugs).
// If a provider is linked to a clinic not present, fallback to its city centroid.
export const CLINIC_COORDS: ClinicCoord[] = [
  // Example entries; extend as addresses are confirmed.
  // { slug: 'fyziocentrum-praha-vaclavak', display_name: 'Fyziocentrum Praha – Václavské náměstí', lat: 50.0813, lon: 14.4255, city_slug: 'praha', address: 'Václavské náměstí 1, Praha 1' },
]

// Optional: ZIP prefix → city centroid mapping (rough proxy when only ZIP is provided)
export const POSTAL_PREFIX_MAP: Record<string, CitySlug> = {
  '10': 'praha', // 10xxx Praha
  '11': 'praha',
  '60': 'brno',  // 60xxx Brno
  '70': 'ostrava',
  '32': 'plzen',
  '77': 'olomouc',
  // Extend with additional prefixes as needed
}


