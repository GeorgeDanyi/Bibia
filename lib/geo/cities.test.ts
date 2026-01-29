import { haversine } from '@/lib/matching/distance'
import { getCityCoords } from './cities'

describe('haversine', () => {
  test('Prague to Brno ≈ 186 km', () => {
    const prague: [number, number] = [50.08, 14.43]
    const brno: [number, number] = [49.19, 16.61]
    const km = haversine(prague, brno)
    expect(km).toBeGreaterThan(180)
    expect(km).toBeLessThan(195)
  })
})

describe('getCityCoords', () => {
  test('Prague / Praha resolve', () => {
    expect(getCityCoords('Prague')).toEqual([50.0755, 14.4378])
    expect(getCityCoords('Praha')).toEqual([50.0755, 14.4378])
  })
  test('Brno resolves', () => {
    expect(getCityCoords('Brno')).toEqual([49.1951, 16.6068])
  })
  test('Karlovy Vary resolves to its own coordinates (not Prague)', () => {
    const kv = getCityCoords('Karlovy Vary')
    expect(kv).not.toBeNull()
    // Approximate expected coordinates near 50.231, 12.871
    expect(kv![0]).toBeCloseTo(50.2310, 3)
    expect(kv![1]).toBeCloseTo(12.8712, 3)
    // Sanity check: not equal to Prague centroid
    expect(kv).not.toEqual([50.0755, 14.4378])
  })
  test('Unknown returns null', () => {
    expect(getCityCoords('Atlantis')).toBeNull()
  })
})


