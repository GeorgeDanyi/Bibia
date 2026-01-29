// Mapping constants for normalizing human-readable labels to internal tags
// DEPRECATED: Use canonical-taxonomy.ts for new implementations

// Legacy mappings - kept for backward compatibility
export const ISSUE_TAGS = {
  "Bolesti zad / krku": "backNeck",
  "Bolesti kloubů": "joints",
  "Bolesti svalů / šlach": "muscles",
  "Bolesti hlavy / migrény": "headache",
  "Sportovní úraz": "sports",
  "Rehabilitace po operaci": "postSurgery",
  "Rehabilitace po úrazu": "postTrauma",
  "Těhotenství / po porodu": "pregnancy",
  "Dlouhodobé onemocnění / diagnóza": "chronic",
  "Jiné potíže": "other"
} as const;

export type IssueLabel = keyof typeof ISSUE_TAGS;
export type IssueTag = typeof ISSUE_TAGS[IssueLabel];

export const DIAGNOSIS_TAGS = {
  "Bechtěrev": "bechterev",
  "Skolióza": "scoliosis",
  "Výhřez ploténky": "discHerniation",
  "Roztroušená skleróza": "ms",
  "Osteoporóza": "osteoporosis",
  "Po operaci menisku": "postMeniscus",
  "Po úrazu kotníku": "ankleInjury"
} as const;

export type DiagnosisLabel = keyof typeof DIAGNOSIS_TAGS;
export type DiagnosisTag = typeof DIAGNOSIS_TAGS[DiagnosisLabel];



// Diagnosis rarity index in [0..1], where 1 means very rare (e.g., Bechtěrev)
// Values are heuristic and can be refined with real-world prevalence data.
export const DIAGNOSIS_RARITY: Record<string, number> = {
  bechterev: 1.0,
  ms: 0.9,
  scoliosis: 0.6,
  discHerniation: 0.4,
  osteoporosis: 0.5,
  postMeniscus: 0.3,
  ankleInjury: 0.2
};

