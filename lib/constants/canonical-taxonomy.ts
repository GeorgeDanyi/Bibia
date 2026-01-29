// Canonical taxonomy for conditions and detail tags
// Single source of truth for mapping Czech labels to canonical codes

// Main condition codes with 1:1 mapping from UI labels
export const CANONICAL_CONDITIONS = {
  "Bolesti zad": "BACK_PAIN",
  "Krční páteř": "NECK", 
  "Rameno / horní končetiny": "SHOULDER_UPPER_LIMB",
  "Koleno / dolní končetiny": "KNEE_LOWER_LIMB",
  "Po úrazu": "POST_INJURY",
  "Po operaci": "POST_SURGERY",
  "Sportovní přetížení": "SPORT_OVERUSE",
  "Dětské obtíže": "PEDIATRIC",
  "Těhotenství / po porodu": "PREGNANCY_POSTPARTUM",
  "Jiná / nejsem si jistý": "OTHER_UNSURE"
} as const;

// Detail tags (optional)
export const CANONICAL_DETAIL_TAGS = {
  "Akutní": "ACUTE",
  "Chronické": "CHRONIC", 
  "Zánět": "INFLAMMATION",
  "Ztuhlost": "STIFFNESS",
  "Slabost": "WEAKNESS",
  "Závratě": "VERTIGO",
  "Bolesti hlavy": "HEADACHE",
  "Problémy se spánkem": "SLEEP_ISSUE"
} as const;

// Type definitions
export type CanonicalConditionCode = typeof CANONICAL_CONDITIONS[keyof typeof CANONICAL_CONDITIONS];
export type CanonicalDetailCode = typeof CANONICAL_DETAIL_TAGS[keyof typeof CANONICAL_DETAIL_TAGS];
export type CzechConditionLabel = keyof typeof CANONICAL_CONDITIONS;
export type CzechDetailLabel = keyof typeof CANONICAL_DETAIL_TAGS;

// Reverse mappings for display purposes
export const CANONICAL_TO_CZECH_CONDITIONS: Record<CanonicalConditionCode, CzechConditionLabel> = {
  "BACK_PAIN": "Bolesti zad",
  "NECK": "Krční páteř",
  "SHOULDER_UPPER_LIMB": "Rameno / horní končetiny", 
  "KNEE_LOWER_LIMB": "Koleno / dolní končetiny",
  "POST_INJURY": "Po úrazu",
  "POST_SURGERY": "Po operaci",
  "SPORT_OVERUSE": "Sportovní přetížení",
  "PEDIATRIC": "Dětské obtíže",
  "PREGNANCY_POSTPARTUM": "Těhotenství / po porodu",
  "OTHER_UNSURE": "Jiná / nejsem si jistý"
};

export const CANONICAL_TO_CZECH_DETAILS: Record<CanonicalDetailCode, CzechDetailLabel> = {
  "ACUTE": "Akutní",
  "CHRONIC": "Chronické",
  "INFLAMMATION": "Zánět", 
  "STIFFNESS": "Ztuhlost",
  "WEAKNESS": "Slabost",
  "VERTIGO": "Závratě",
  "HEADACHE": "Bolesti hlavy",
  "SLEEP_ISSUE": "Problémy se spánkem"
};

// Helper functions
export function getCanonicalConditionCode(czechLabel: string): CanonicalConditionCode | null {
  return CANONICAL_CONDITIONS[czechLabel as CzechConditionLabel] || null;
}

export function getCanonicalDetailCode(czechLabel: string): CanonicalDetailCode | null {
  return CANONICAL_DETAIL_TAGS[czechLabel as CzechDetailLabel] || null;
}

export function getCzechConditionLabel(canonicalCode: CanonicalConditionCode): CzechConditionLabel {
  return CANONICAL_TO_CZECH_CONDITIONS[canonicalCode];
}

export function getCzechDetailLabel(canonicalCode: CanonicalDetailCode): CzechDetailLabel {
  return CANONICAL_TO_CZECH_DETAILS[canonicalCode];
}

// Validation functions
export function isValidCanonicalConditionCode(code: string): code is CanonicalConditionCode {
  return Object.values(CANONICAL_CONDITIONS).includes(code as CanonicalConditionCode);
}

export function isValidCanonicalDetailCode(code: string): code is CanonicalDetailCode {
  return Object.values(CANONICAL_DETAIL_TAGS).includes(code as CanonicalDetailCode);
}
