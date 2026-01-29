// Questionnaire data schemas and validation

export const QUESTIONNAIRE_STEPS = [
  { id: 1, key: 'conditions', label: 'Problémy' },
  { id: 2, key: 'contact', label: 'Kontakt' },
  { id: 3, key: 'location', label: 'Místo' },
  { id: 4, key: 'time', label: 'Čas' },
  { id: 5, key: 'preferences', label: 'Preference' },
  { id: 6, key: 'summary', label: 'Shrnutí' }
] as const

export const CONDITION_OPTIONS = [
  { key: 'backNeck', label: 'Bolesti zad / krku' },
  { key: 'joints', label: 'Bolesti kloubů' },
  { key: 'musclesTendons', label: 'Bolesti svalů / šlach' },
  { key: 'headaches', label: 'Bolesti hlavy / migrény' },
  { key: 'sports', label: 'Sportovní úraz' },
  { key: 'postSurgery', label: 'Rehabilitace po operaci' },
  { key: 'postInjury', label: 'Rehabilitace po úrazu' },
  { key: 'pregnancy', label: 'Těhotenství / po porodu' },
  { key: 'chronic', label: 'Dlouhodobé onemocnění / diagnóza' },
  { key: 'other', label: 'Jiné potíže' }
] as const

export const LOCATION_OPTIONS = [
  { key: 'online', label: 'Online konzultace' },
  { key: 'clinic', label: 'V ordinaci' },
  { key: 'home', label: 'Doma' }
] as const

export const TIME_OPTIONS = [
  { key: 'morning', label: 'Ráno (7–11)' },
  { key: 'lateMorning', label: 'Dopoledne (9–13)' },
  { key: 'afternoon', label: 'Odpoledne (13–17)' },
  { key: 'evening', label: 'Večer (17–20)' },
  { key: 'weekend', label: 'Víkend' }
] as const

export const GENDER_OPTIONS = [
  { key: 'male', label: 'Muž' },
  { key: 'female', label: 'Žena' },
  { key: 'any', label: 'Nezáleží' }
] as const

export const LANGUAGE_OPTIONS = [
  { key: 'cs', label: 'Čeština' },
  { key: 'en', label: 'Angličtina' },
  { key: 'de', label: 'Němčina' },
  { key: 'ru', label: 'Ruština' }
] as const
