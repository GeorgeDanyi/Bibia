// Czech questionnaire v1 steps - 6 steps total
export const STEPS_V1 = [
  { id: 0, key: 'location', label: 'Kde a jak' },
  { id: 1, key: 'conditions', label: 'S čím pomoct' },
  { id: 2, key: 'diagnosis', label: 'Diagnóza' },
  { id: 3, key: 'modalities', label: 'Přístupy' },
  { id: 4, key: 'availability', label: 'Kdy se hodí' },
  { id: 5, key: 'preferences', label: 'Jazyk, cena' },
  { id: 6, key: 'special-needs', label: 'Další potřeby' }
] as const

export const STEP_V1 = {
  LOCATION: 0,        // Krok 1: Lokalita & forma péče
  CONDITIONS: 1,      // Krok 2: Důvod návštěvy
  DIAGNOSIS: 2,       // Krok 3: Diagnóza (volitelný)
  MODALITIES: 3,      // Krok 4: Preferované modality (volitelné)
  AVAILABILITY: 4,    // Krok 5: Dostupnost & rychlost
  PREFERENCES: 5,     // Krok 6: Jazyk, cena, pojišťovna
  SPECIAL_NEEDS: 6    // Krok 7: Speciální potřeby
} as const

export type StepV1Key = (typeof STEPS_V1)[number]['key']
