import { Physio } from '@/lib/types/recommendations'

export const MOCK_PHYSIOS: Physio[] = Array.from({ length: 24 }).map((_, i) => {
  const cities = ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Č. Budějovice', 'Hradec Králové']
  const exps = ['sportovci','děti','senioři','těhotenství a porod','ženské zdraví','rehabilitace po úrazu']
  const langs = ['cs','en','de','ru','ua','sk']
  const gender = i % 2 === 0 ? 'Muž' : 'Žena'
  const city = cities[i % cities.length]
  const distanceKm = Math.round((i * 2.3 + 3) % 50)
  const experiences = [exps[i % exps.length], exps[(i+2) % exps.length]]
  const languages = [langs[i % langs.length], langs[(i+3) % langs.length]]
  return {
    id: `p${i+1}`,
    name: gender === 'Muž' ? `Jan ${String.fromCharCode(65 + (i%26))}lánek` : `Eva ${String.fromCharCode(65 + (i%26))}nová`,
    title: 'Fyzioterapeut',
    city,
    distanceKm,
    gender,
    languages,
    experiences,
    rating: Math.round((4 + ((i%5)/10)) * 10) / 10,
    years: 3 + (i % 20),
    priceFrom: 700 + (i % 7) * 50,
    photo: `/images/avatar${(i % 3) + 1}.svg`,
  }
})

export function scorePhysios(physios: Physio[], criteria: { gender?: string; langs?: string[]; experiences?: string[]; maxKm?: number; }): { physio: Physio; score: number; reasons: string[] }[] {
  return physios.map((p) => {
    let score = 0
    const reasons: string[] = []
    // experience overlap *2
    const expOverlap = (criteria.experiences || []).filter(e => p.experiences.includes(e)).slice(0, 2)
    score += expOverlap.length * 2
    if (expOverlap.length) reasons.push(`Specializace: ${expOverlap.join(', ')}`)
    // language overlap *1
    const langOverlap = (criteria.langs || []).filter(l => p.languages.includes(l)).slice(0, 2)
    score += langOverlap.length * 1
    if (langOverlap.length) reasons.push(`Jazyk: ${langOverlap.join(', ')}`)
    // gender exact +2 if specified
    if (criteria.gender && criteria.gender !== 'Nezáleží') {
      if (p.gender === criteria.gender) {
        score += 2
        reasons.push('Preferované pohlaví')
      }
    }
    // distance bonus
    if (typeof p.distanceKm === 'number') {
      if (p.distanceKm < 5) { score += 3 } else if (p.distanceKm < 10) { score += 2 } else if (p.distanceKm < 20) { score += 1 }
      reasons.push(`Vzdálenost ${p.distanceKm} km`)
    }
    return { physio: p, score, reasons: reasons.slice(0, 4) }
  })
}

