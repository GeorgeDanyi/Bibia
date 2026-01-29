export function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
  return Math.round((R * c) * 10) / 10
}


