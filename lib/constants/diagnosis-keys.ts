// Stable diagnosis keys for matching (no diacritics, snake_case)
// Grouped by high-level subcategories

export const DIAGNOSIS_KEYS = {
  chronic: [
    'skolioza',
    'bechterev',
    'chronic_back_pain',
    'artroza',
    'tendinopatie',
    'plantarni_fasciitida'
  ],
  trauma_postop: [
    'ankle_sprain',
    'knee_injury_acl_mcl',
    'post_fracture_rehab',
    'post_spine_surgery',
    'post_meniscus_surgery',
    'post_hip_arthroplasty'
  ],
  neuro: [
    'rs',
    'parkinson',
    'post_stroke',
    'polyneuropatie',
    'radikulopatie',
    'dmo'
  ],
  onco_rare: [
    'lymfedem',
    'onko_rehab',
    'scar_management_onco',
    'cipn',
    'cancer_related_fatigue',
    'rare_diagnosis_consult'
  ]
} as const

export type DiagnosisSubcategory = keyof typeof DIAGNOSIS_KEYS
export type DiagnosisKey = typeof DIAGNOSIS_KEYS[DiagnosisSubcategory][number]

export const ALL_DIAGNOSIS_KEYS: DiagnosisKey[] = (
  Object.values(DIAGNOSIS_KEYS).flat()
) as DiagnosisKey[]


