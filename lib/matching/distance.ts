export function haversine(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a
  const [lat2, lon2] = b
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const s1 = Math.sin(dLat / 2) ** 2
  const s2 = Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(s1 + s2), Math.sqrt(1 - (s1 + s2)))
  return R * c
}


