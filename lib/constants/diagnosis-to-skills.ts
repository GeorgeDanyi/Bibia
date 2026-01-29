import type { DiagnosisKey } from './diagnosis-keys'

// Map diagnosis keys → therapist skill tags (1..n)
export const DIAGNOSIS_TO_SKILLS: Record<DiagnosisKey, string[]> = {
  skolioza: ['spine', 'posture', 'scoliosis'],
  bechterev: ['axial_spondyloarthritis', 'spine', 'inflammation'],
  chronic_back_pain: ['spine', 'pain_management'],
  artroza: ['osteoarthritis', 'joint_care'],
  tendinopatie: ['tendon', 'overuse'],
  plantarni_fasciitida: ['foot', 'overuse'],

  ankle_sprain: ['ankle', 'sports'],
  knee_injury_acl_mcl: ['knee', 'sports'],
  post_fracture_rehab: ['orthopedic_rehab'],
  post_spine_surgery: ['spine', 'postop'],
  post_meniscus_surgery: ['knee', 'postop'],
  post_hip_arthroplasty: ['hip', 'postop'],

  rs: ['neurology', 'ms'],
  parkinson: ['neurology', 'parkinson'],
  post_stroke: ['neurology', 'stroke'],
  polyneuropatie: ['neurology', 'peripheral'],
  radikulopatie: ['spine', 'nerve_root'],
  dmo: ['pediatrics', 'neurology'],

  lymfedem: ['lymph', 'oncology'],
  onko_rehab: ['oncology', 'fatigue'],
  scar_management_onco: ['scar', 'oncology'],
  cipn: ['oncology', 'neuropathy'],
  cancer_related_fatigue: ['oncology', 'fatigue'],
  rare_diagnosis_consult: ['complex_cases']
}

export type DiagnosisSkillTag = string


