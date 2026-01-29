import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalizeDiagnosis } from '../src/lib/normalizeDiagnosis.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const file = path.join(__dirname, '../data/fake-therapists-complete.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

for (const t of data) {
  const fromTags: string[] = Array.isArray(t.diagnosisTags) ? t.diagnosisTags : []
  const fromDiagnoses: string[] = Array.isArray(t.diagnoses) ? t.diagnoses : []
  const fromSpecialties: string[] = Array.isArray(t.specialties) ? t.specialties : []
  const fromGenericTags: string[] = Array.isArray(t.tags) ? t.tags : []
  const combined = [...fromTags, ...fromDiagnoses, ...fromSpecialties, ...fromGenericTags]
  const normalized = combined
    .map((d: string) => normalizeDiagnosis(d))
    .filter(Boolean) as string[]
  // dedupe
  t.diagnosisTags = Array.from(new Set(normalized))
  if (!Array.isArray(t.diagnosisTags) || t.diagnosisTags.length === 0) {
    // Ensure at least one tag exists by using normalized specialties/tags if available
    const fallback = [...fromSpecialties, ...fromGenericTags]
      .map((d: string) => normalizeDiagnosis(d))
      .filter(Boolean) as string[]
    if (fallback.length > 0) t.diagnosisTags = Array.from(new Set(fallback))
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2))
console.log('Normalized diagnosisTags for all therapists.')


