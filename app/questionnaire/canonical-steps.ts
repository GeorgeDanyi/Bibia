// Czech questionnaire v1 steps - 6 steps total
export const STEPS_V1 = [
  { id: 0, key: 'location', label: 'Kde a jak' },
  { id: 1, key: 'conditions', label: 'S čím pomoct' },
  { id: 2, key: 'diagnosis', label: 'Diagnóza' },
  { id: 3, key: 'availability', label: 'Kdy se hodí' },
  { id: 4, key: 'preferences', label: 'Jazyk a pojišťovna' },
  { id: 5, key: 'special-needs', label: 'Další potřeby' }
] as const

export const STEP_V1 = {
  LOCATION: 0,        // Krok 1: Lokalita & forma péče
  CONDITIONS: 1,      // Krok 2: Důvod návštěvy
  DIAGNOSIS: 2,       // Krok 3: Diagnóza
  AVAILABILITY: 3,    // Krok 4: Dostupnost
  PREFERENCES: 4,     // Krok 5: Jazyk a pojišťovna
  SPECIAL_NEEDS: 5    // Krok 6: Speciální potřeby
} as const

export type StepV1Key = (typeof STEPS_V1)[number]['key']
