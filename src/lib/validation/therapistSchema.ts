import { z } from 'zod'

// Therapist schema with exact specifications from Part B
export const therapistSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  practiceType: z.enum(['clinic', 'home', 'online']),
  diagnosisTags: z.array(z.string()).transform(tags => 
    tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag.length > 0)
  ),
  languages: z.array(z.string()),
  acceptingNew: z.boolean().default(true),
  nextAvailableDays: z.number().min(0).max(60).nullable(),
  pricePerHour: z.number().nullable(),
  isFixture: z.boolean().optional()
})

// Type inference from schema
export type Therapist = z.infer<typeof therapistSchema>

// Validation result types
export interface ValidationResult {
  ok: Therapist[]
  bad: { row: any; issues: string[] }[]
}

// Main validation function
export const validateTherapists = (rows: any[]): ValidationResult => {
  const ok: Therapist[] = []
  const bad: { row: any; issues: string[] }[] = []
  
  for (const row of rows) {
    try {
      const validated = therapistSchema.parse(row)
      ok.push(validated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        bad.push({ row, issues })
      } else {
        bad.push({ row, issues: ['Unknown validation error'] })
      }
    }
  }
  
  return { ok, bad }
}