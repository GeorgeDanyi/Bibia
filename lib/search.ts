import type { Criteria, Therapist } from '@/types/search'
import { haversineKm } from './geo'

export interface Reason { label: string; weight: number }
export interface Ranked {
  th: Therapist
  score: number
  reasons: Reason[]
  distanceKm: number | null
  nearMatch: boolean
}

export function hardPass(th: Therapist, c: Criteria, distKm: number|null): { pass: boolean; missed?: 'languages'|'specialties'|'issues'|'none' } {
  if (c.gender !== 'any' && th.sex !== c.gender) return { pass:false, missed:'none' }
  if (c.mode !== 'both' && !th.modes.includes(c.mode)) return { pass:false, missed:'none' }
  if (c.mode !== 'online' && c.place && th.coords) {
    if (distKm!==null && distKm>c.maxDistanceKm) return { pass:false, missed:'none' }
  }
  if (c.languages.length>0) {
    const has= c.languages.every(l=>th.languages.includes(l))
    const some= c.languages.some(l=>th.languages.includes(l))
    if (c.strict && !has) return { pass:false, missed:'languages' }
    if (!c.strict && !some) return { pass:false, missed:'languages' }
  }
  if (c.specialties.length>0) {
    const has= c.specialties.every(s=>th.specialties.includes(s))
    const some= c.specialties.some(s=>th.specialties.includes(s))
    if (c.strict && !has) return { pass:false, missed:'specialties' }
    if (!c.strict && !some) return { pass:false, missed:'specialties' }
  }
  if (c.issues.length>0 && !c.issues.some(i=>th.issues.includes(i))) {
    return { pass:false, missed:'issues' }
  }
  return { pass:true, missed:'none' }
}

const labelLang = (l: string) => ({cs:'Čeština',en:'Angličtina',de:'Němčina',ru:'Ruština',uk:'Ukrajinština',sk:'Slovenština'} as Record<string,string>)[l] || l
const labelSpec = (s: string) => ({'sportovci':'Sportovci','deti':'Děti','seniori':'Senioři','tehotenstvi':'Těhotenství a porod','zenske-zdravi':'Ženské zdraví','rehabilitace-po-urazu':'Rehabilitace po úrazu'} as Record<string,string>)[s] || s
const labelIssue = (i: string) => ({'bolesti-krk-zada':'Bolesti krku a zad','menstrualni-potize':'Menstruační potíže'} as Record<string,string>)[i] || i

export function scoreTherapist(th: Therapist, c: Criteria, distKm: number|null) {
  let score = 0
  const reasons: Reason[] = []
  const add = (label:string, w:number)=>{ score+=w; reasons.push({label,weight:w}) }

  const specMatches = th.specialties.filter(s=>c.specialties.includes(s)).slice(0,2)
  specMatches.forEach(s=>add(`Specializace: ${labelSpec(s)}`, 30))

  const issueMatch = th.issues.find(i=>c.issues.includes(i))
  if (issueMatch) add(`Problém: ${labelIssue(issueMatch)}`, 25)

  const langMatches = th.languages.filter(l=>c.languages.includes(l)).slice(0,2)
  langMatches.forEach(l=>add(`Jazyk: ${labelLang(l)}`, 15))

  if (c.gender!=='any' && th.sex===c.gender) add('Preferované pohlaví', 10)
  if (c.mode==='both' || th.modes.includes(c.mode)) add(`Režim: ${c.mode==='online'?'online':'ordinace'}`, 10)

  const hasSlot = c.timeSlots.length>0 && th.availability?.slots?.some(s=>c.timeSlots.includes(s))
  const hasDay  = c.days.length>0 && th.availability?.days?.some(d=>c.days.includes(d))
  if (hasSlot || hasDay) add('Dostupný v preferovaném čase', 10)

  if (c.mode!=='online' && distKm!=null) {
    if (distKm<=2) add('Vzdálenost ≤ 2 km',10)
    else if (distKm<=5) add('Vzdálenost ≤ 5 km',6)
    else if (distKm<=10) add('Vzdálenost ≤ 10 km',3)
  }
  if (typeof th.rating==='number') add('Kvalitní hodnocení', Math.max(0,(th.rating-3.5)*10))
  if (typeof th.years==='number') add('Zkušenost', Math.min(th.years,10))

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons }
}

export function rankTherapists(list: Therapist[], c: Criteria): Ranked[] {
  const out: Ranked[] = []
  for (const th of list) {
    const distKm = (c.place && th.coords) ? haversineKm(c.place, th.coords) : null
    const { pass, missed } = hardPass(th,c,distKm)
    if (!pass) {
      if (!c.strict && (missed==='languages'||missed==='specialties'||missed==='issues')) {
        const { score, reasons } = scoreTherapist(th,c,distKm)
        if (score>=40) out.push({ th, score, reasons, distanceKm: distKm, nearMatch:true })
      }
      continue
    }
    const { score, reasons } = scoreTherapist(th,c,distKm)
    out.push({ th, score, reasons, distanceKm: distKm, nearMatch:false })
  }

  const sortBy = c.sort ?? 'match'
  if (sortBy==='nearest') out.sort((a,b)=>(a.distanceKm??1e9)-(b.distanceKm??1e9) || b.score-a.score)
  else if (sortBy==='rating') out.sort((a,b)=> (b.th.rating??0)-(a.th.rating??0) || b.score-a.score)
  else out.sort((a,b)=> b.score-a.score || (a.distanceKm??1e9)-(b.distanceKm??1e9) || (b.th.rating??0)-(a.th.rating??0))

  const seen = new Map<string,number>()
  const diversified: Ranked[] = []
  for (const r of out) {
    const key = `${r.th.city}|${(r.th.specialties[0]||'')}`
    const penalty = seen.get(key) ? 5 : 0
    diversified.push({ ...r, score: Math.max(0,r.score-penalty) })
    seen.set(key, (seen.get(key)||0)+1)
  }
  diversified.sort((a,b)=> b.score-a.score)
  return diversified
}


