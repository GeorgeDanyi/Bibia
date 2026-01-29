#!/usr/bin/env ts-node
import fs from 'node:fs'
import path from 'node:path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import SEEDS from '../data/seeds/therapists_minimal.json'
// eslint-disable-next-line
const { prepareCandidates } = require('../lib/pipeline/prepareCandidates')
// eslint-disable-next-line
const { shapeResults } = require('../lib/results/shape')

function printScenario(title: string, user: any) {
  console.log(`\n=== ${title} ===`)
  const { candidates, rejected } = prepareCandidates({ user, therapists: SEEDS as any })
  const shaped = shapeResults({ user, candidates })
  const top = shaped.results.slice(0, 3) as any[]
  console.log(`Top3: ${top.map((t: any) => t.therapist.id).join(', ')}`)
  top.forEach((r: any, i: number) => {
    const e = r.explanation
    console.log(` ${i+1}. ${r.therapist.id} [${r.mode}] score=${r.score}`)
    console.log(`    dist=${e.distance_km} pts=${e.distance_points} diag=${e.diagnosis_signal}/${e.diagnosis_points} region=${e.region_points}`)
    console.log(`    avail=${e.availability_pairs.matched}/${e.availability_pairs.requested} pts=${e.availability_points} lang=${e.language_points} grp=${e.group_points} asap=${e.asap_bonus}`)
  })
}

function main() {
  const runs: string[][] = []
  // Scenario 1
  const s1 = {
    meeting_modes: ['clinic'],
    city: 'Praha',
    diagnosis_categories: ['injury'],
    diagnosis_ids: ['dx_acl_rupture'],
    body_regions: ['knee'],
    days: ['Mon','Tue'],
    bands: ['afternoon','evening'],
    insurerPref: 'insurance_claim',
    patient_for: 'adult',
    therapist_gender_pref: 'any',
    barrier_free_required: true,
    primaryLanguage: 'cs',
    preferredLanguages: ['cs','en']
  }
  for (let i=0;i<2;i++) {
    const { candidates } = prepareCandidates({ user: s1, therapists: SEEDS as any })
    const shaped = shapeResults({ user: s1, candidates })
    const ids = shaped.results.slice(0,3).map((r: any) => r.therapist.id)
    runs.push(ids)
  }
  console.log(`S1 Top3 Run1: ${runs[0].join(', ')}`)
  console.log(`S1 Top3 Run2: ${runs[1].join(', ')}`)

  // Scenario 2
  const s2 = {
    meeting_modes: ['home_visit'],
    city: 'Brno',
    diagnosis_categories: ['postpartum'],
    diagnosis_ids: ['dx_diastasis'],
    body_regions: ['postpartum','abdominal_wall'],
    days: ['asap'],
    bands: ['asap'],
    insurerPref: 'self_pay',
    patient_for: 'adult',
    therapist_gender_pref: 'any',
    primaryLanguage: 'cs',
    preferredLanguages: ['cs','en']
  }
  for (let i=0;i<2;i++) {
    const { candidates } = prepareCandidates({ user: s2, therapists: SEEDS as any })
    const shaped = shapeResults({ user: s2, candidates })
    const ids = shaped.results.slice(0,3).map((r: any) => r.therapist.id)
    runs.push(ids)
  }
  console.log(`S2 Top3 Run1: ${runs[2].join(', ')}`)
  console.log(`S2 Top3 Run2: ${runs[3].join(', ')}`)

  // Scenario 3
  const s3 = {
    meeting_modes: ['any'],
    city: 'Ostrava',
    diagnosis_categories: ['neuro'],
    diagnosis_ids: [],
    body_regions: [],
    days: ['Sat','Sun'],
    bands: ['weekend'],
    insurerPref: 'self_pay',
    patient_for: 'senior',
    therapist_gender_pref: 'any',
    primaryLanguage: 'en',
    preferredLanguages: ['en']
  }
  for (let i=0;i<2;i++) {
    const { candidates } = prepareCandidates({ user: s3, therapists: SEEDS as any })
    const shaped = shapeResults({ user: s3, candidates })
    const ids = shaped.results.slice(0,3).map((r: any) => r.therapist.id)
    runs.push(ids)
  }
  console.log(`S3 Top3 Run1: ${runs[4].join(', ')}`)
  console.log(`S3 Top3 Run2: ${runs[5].join(', ')}`)

  const pass = runs[0].join('|') === runs[1].join('|') && runs[2].join('|') === runs[3].join('|') && runs[4].join('|') === runs[5].join('|')
  if (!pass) {
    console.error('Deterministic check failed: Top3 not stable between runs')
    process.exit(1)
  }
  console.log('Deterministic check passed: identical Top3 across runs')
}

main()


