'use client'

import React from "react"

// Function to translate diagnosis terms to Czech
function translateDiagnosis(term: string): string {
  const translations: Record<string, string> = {
    // Spine and back issues
    'spine_pain': 'Bolesti páteře',
    'back_pain': 'Bolesti zad',
    'spine': 'Páteř',
    'back': 'Záda',
    'neck_pain': 'Bolesti krku',
    'cervical': 'Krk',
    'lumbar': 'Bederní páteř',
    'thoracic': 'Hrudní páteř',
    
    // Pelvic and postpartum
    'pelvic_floor': 'Pánevní dno',
    'pelvic': 'Pánevní',
    'postpartum': 'Poporodní',
    'postpartum_rehab': 'Poporodní rehabilitace',
    'incontinence': 'Inkontinence',
    'postpartum_care': 'Poporodní péče',
    
    // Joints and limbs
    'knee': 'Koleno',
    'ankle': 'Kotník',
    'shoulder': 'Rameno',
    'elbow': 'Loket',
    'hip': 'Kyčel',
    'wrist': 'Zápěstí',
    
    // Common conditions
    'arthritis': 'Artritida',
    'tendinitis': 'Tendinitida',
    'bursitis': 'Bursitida',
    'sprain': 'Podvrtnutí',
    'strain': 'Natažení',
    'fracture': 'Zlomenina',
    'surgery': 'Operace',
    'post_surgery': 'Po operaci',
    'rehabilitation': 'Rehabilitace',
    
    // Neurological
    'stroke': 'Mrtvice',
    'parkinson': 'Parkinson',
    'multiple_sclerosis': 'Roztroušená skleróza',
    'ms': 'RS',
    'als': 'ALS',
    'neuropathy': 'Neuropatie',
    
    // Sports and injuries
    'sports_injury': 'Sportovní zranění',
    'tennis_elbow': 'Tenisový loket',
    'golfers_elbow': 'Golfový loket',
    'rotator_cuff': 'Rotátorová manžeta',
    'acl': 'ACL',
    'mcl': 'MCL',
    'meniscus': 'Menisky',
    
    // Age groups
    'pediatric': 'Dětská',
    'geriatric': 'Geriatrická',
    'adult': 'Dospělá',
    
    // Other
    'chronic_pain': 'Chronická bolest',
    'acute_pain': 'Akutní bolest',
    'muscle_pain': 'Svalová bolest',
    'joint_pain': 'Bolest kloubů',
    'headache': 'Bolest hlavy',
    'migraine': 'Migréna'
  }
  
  // Try exact match first
  if (translations[term.toLowerCase()]) {
    return translations[term.toLowerCase()]
  }
  
  // Try partial matches
  const lowerTerm = term.toLowerCase()
  for (const [key, translation] of Object.entries(translations)) {
    if (lowerTerm.includes(key) || key.includes(lowerTerm)) {
      return translation
    }
  }
  
  // If no translation found, return original term with first letter capitalized
  return term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
}

type Gender = "female" | "male" | "any" | null

export type NormalizedQuery = {
  city?: string | null
  radiusKm?: number | null
  meetingType?: "clinic" | "home_visit" | "online" | null
  languages?: string[] | null
  day?: string | null
  timeSlot?: string | null
  insurance?: string[] | null
  genderPref?: Gender
  diagnoses?: Array<{ id: string; label: string }> | null
  problemAreas?: string[] | null
  availabilityHint?: string | null
  fallback?: { used: boolean; reason?: string } | null
}

function labelGender(g: Gender) {
  if (g === "female") return "ženu"
  if (g === "male") return "muže"
  return "libovolné"
}

function labelMeeting(t?: NormalizedQuery["meetingType"]) {
  if (t === "clinic") return "ordinace"
  if (t === "home_visit") return "návštěva doma"
  if (t === "online") return "online"
  return "typ setkání: libovolný"
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((t, i) => (
        <button
          key={i}
          type="button"
          aria-label={t}
          className="inline-flex items-center rounded-full border px-2 py-1 text-xs cursor-default"
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export default function QuestionnaireSummary({ q, onEdit }: { q: NormalizedQuery; onEdit?: () => void }) {
  // Build problem labels from diagnoses or problem areas or fallback to "neuvedeno"
  const prob = (q.diagnoses && q.diagnoses.length) 
    ? q.diagnoses.map(d => translateDiagnosis(d.label)).join(", ")
    : (q.problemAreas && q.problemAreas.length)
      ? q.problemAreas.map(area => translateDiagnosis(area)).join(", ")
      : "neuvedeno"
  
  const gender = labelGender(q.genderPref ?? null)
  
  // Build time display with urgency, day, and timeSlot
  const timeParts = []
  if (q.availabilityHint?.includes("ASAP") || q.availabilityHint?.includes("nejdřív")) {
    timeParts.push("ASAP")
  }
  if (q.day) timeParts.push(q.day === "weekend" ? "víkend" : "pracovní dny")
  if (q.timeSlot) timeParts.push(q.timeSlot === "evening" ? "večer" : "dopoledne")
  const timeDisplay = timeParts.length > 0 ? timeParts.join(", ") : "kdykoli"
  
  const meet = labelMeeting(q.meetingType)
  const place = [q.city || "bez města", q.radiusKm ? `${q.radiusKm} km` : ""].filter(Boolean).join(", ")
  const langs = q.languages?.length ? q.languages : []
  const ins = q.insurance?.length ? q.insurance : []

  return (
    <section aria-label="Shrnutí dotazu" className="mb-3 rounded-lg border bg-white p-3">
      <div className="text-sm">
        <strong>Hledám:</strong> {gender}
        {" • "}
        <strong>Problém:</strong> {prob}
        {" • "}
        <strong>Čas:</strong> {timeDisplay}
        {" • "}
        <strong>Setkání:</strong> {meet}
        {" • "}
        <strong>Lokalita:</strong> {place}
        {langs.length > 0 && (
          <>
            {" • "}
            <strong>Jazyk:</strong> {langs.join(", ")}
          </>
        )}
        {ins.length > 0 && (
          <>
            {" • "}
            <strong>Pojišťovna:</strong> ano
          </>
        )}
      </div>

      <Chips items={[
        ...(q.diagnoses?.map(d => translateDiagnosis(d.label)) ?? []),
      ]} />
      <div className="mt-2 flex flex-wrap gap-2">
        {langs.length > 0 && <Chips items={["Jazyky", ...langs]} />}
        {ins.length > 0 && <Chips items={["Pojišťovny", ...ins]} />}
      </div>

      {q.availabilityHint && (
        <div className="mt-2 text-xs text-gray-600">Dostupnost: {q.availabilityHint}</div>
      )}

      {q.fallback?.used && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">
          Zobrazeny i alternativy. Důvod: {q.fallback.reason || "bez specifikace"}.
        </div>
      )}

      <div className="mt-3">
        <button type="button" onClick={onEdit} className="text-xs underline">Upravit odpovědi</button>
      </div>
    </section>
  )
}


