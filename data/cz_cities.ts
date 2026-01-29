export interface CzCity {
  city: string
  lat: number
  lon: number
  population: number
  aliases: string[]
}

// Minimal seed; extend to ≥5k pop and districts as needed.
export const CZ_CITIES: CzCity[] = [
  { city: 'Praha', lat: 50.0755, lon: 14.4378, population: 1320000, aliases: ['prague','hlavni mesto praha','praha1','praha 1','praha 2','praha 3','praha 4','praha 5','praha 6','praha 7','praha 8','praha 9','praha-centrum'] },
  { city: 'Brno', lat: 49.1951, lon: 16.6068, population: 380000, aliases: ['brno-stred','brno stred','brno-sever','brno jih','brno-jih','brnomesto','brno-mesto'] },
  { city: 'Ostrava', lat: 49.8209, lon: 18.2625, population: 280000, aliases: ['ostrava mesto','ostrava-mesto'] },
  // Karlovy Vary – ensure explicit entry so we never fall back to Prague
  { city: 'Karlovy Vary', lat: 50.2310, lon: 12.8712, population: 50000, aliases: ['karlovy vary','karlovy+vary','karlovy-vary'] },
  { city: 'Kladno', lat: 50.1473, lon: 14.1029, population: 68000, aliases: [] },
  { city: 'Plzeň', lat: 49.7384, lon: 13.3736, population: 170000, aliases: ['plzen','plzen-mesto'] },
  { city: 'Liberec', lat: 50.7671, lon: 15.0562, population: 100000, aliases: [] },
  { city: 'Olomouc', lat: 49.5938, lon: 17.2509, population: 100000, aliases: [] },
  { city: 'České Budějovice', lat: 48.9747, lon: 14.4743, population: 94000, aliases: ['ceske budejovice','c. budejovice','cb','čb','ceske budejovice-mesto'] },
  { city: 'Hradec Králové', lat: 50.2104, lon: 15.8252, population: 93000, aliases: ['hradec kralove','hk','králové hradec','hradec k'] },
]


