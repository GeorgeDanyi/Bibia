import { z } from "zod"
import { validateTherapistRecord } from './therapist'
import { validateCoordinatePair } from './coordinates'

// CSV row schema for therapist import
export const csvTherapistRowSchema = z.object({
  // Required fields
  id: z.string().min(1, "ID is required"),
  fullName: z.string().min(1, "Full name is required"),
  city: z.string().min(1, "City is required"),
  latitude: z.string().transform((val) => {
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error("Latitude must be a valid number")
    return num
  }),
  longitude: z.string().transform((val) => {
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error("Longitude must be a valid number")
    return num
  }),
  practiceType: z.string().min(1, "Practice type is required"),
  acceptingNew: z.string().transform((val) => {
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    throw new Error("Accepting new must be true/false, 1/0, or yes/no")
  }),
  yearsExperience: z.string().transform((val) => {
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Years experience must be a valid integer")
    return num
  }),
  pricePerSession: z.string().transform((val) => {
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Price per session must be a valid integer")
    return num
  }),
  languages: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(lang => lang.trim()).filter(Boolean)
  }),
  specialties: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(spec => spec.trim()).filter(Boolean)
  }),
  diagnosisTags: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(tag => tag.trim()).filter(Boolean)
  }),
  tags: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(tag => tag.trim()).filter(Boolean)
  }),

  // Optional fields
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  clinicName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  insuranceAccepted: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(ins => ins.trim()).filter(Boolean)
  }).optional(),
  isVerified: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    return undefined
  }).optional(),
  lastActive: z.string().optional(),
  regions: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(region => region.trim()).filter(Boolean)
  }).optional(),
  modalities: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(mod => mod.trim()).filter(Boolean)
  }).optional(),
  worksWith: z.string().transform((val) => {
    if (!val.trim()) return []
    return val.split(',').map(group => group.trim()).filter(Boolean)
  }).optional(),
  reviewsCount: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Reviews count must be a valid integer")
    return num
  }).optional(),

  // Rating fields
  ratingAverage: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseFloat(val)
    if (isNaN(num)) throw new Error("Rating average must be a valid number")
    return num
  }).optional(),
  ratingCount: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Rating count must be a valid integer")
    return num
  }).optional(),

  // Availability fields
  nextAvailableDays: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Next available days must be a valid integer")
    return num
  }).optional(),
  workingHoursMorning: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    return undefined
  }).optional(),
  workingHoursMidday: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    return undefined
  }).optional(),
  workingHoursEvening: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    return undefined
  }).optional(),
  workingHoursWeekend: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const lower = val.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
    return undefined
  }).optional(),

  // Price range fields
  priceRangeMin: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Price range min must be a valid integer")
    return num
  }).optional(),
  priceRangeMax: z.string().transform((val) => {
    if (!val.trim()) return undefined
    const num = parseInt(val)
    if (isNaN(num)) throw new Error("Price range max must be a valid integer")
    return num
  }).optional()
})

// Validation result for CSV import
export interface CsvImportResult {
  success: boolean
  validRows: any[]
  invalidRows: {
    rowNumber: number
    data: any
    errors: string[]
  }[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    successRate: number
  }
}

// Parse CSV content
export function parseCsvContent(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  // Simple CSV parser that handles quoted fields
  function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  const headers = parseCsvLine(lines[0]).map(h => h.replace(/"/g, ''))
  const rows: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]).map(v => v.replace(/"/g, ''))
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}`)
    }

    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    rows.push(row)
  }

  return rows
}

// Validate CSV import
export function validateCsvImport(csvContent: string): CsvImportResult {
  try {
    const rows = parseCsvContent(csvContent)
    const validRows: any[] = []
    const invalidRows: { rowNumber: number; data: any; errors: string[] }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // +2 because CSV is 1-indexed and we skip header

      try {
        // First validate CSV row structure
        const csvValidated = csvTherapistRowSchema.parse(row)
        
        // Transform to therapist record format
        const therapistRecord = {
          id: csvValidated.id,
          fullName: csvValidated.fullName,
          city: csvValidated.city,
          latitude: csvValidated.latitude,
          longitude: csvValidated.longitude,
          practiceType: csvValidated.practiceType,
          acceptingNew: csvValidated.acceptingNew,
          yearsExperience: csvValidated.yearsExperience,
          pricePerSession: csvValidated.pricePerSession,
          languages: csvValidated.languages,
          specialties: csvValidated.specialties,
          diagnosisTags: csvValidated.diagnosisTags,
          tags: csvValidated.tags,
          bio: csvValidated.bio,
          profileImage: csvValidated.profileImage,
          clinicName: csvValidated.clinicName,
          address: csvValidated.address,
          phone: csvValidated.phone,
          email: csvValidated.email,
          website: csvValidated.website,
          insuranceAccepted: csvValidated.insuranceAccepted,
          isVerified: csvValidated.isVerified,
          lastActive: csvValidated.lastActive,
          regions: csvValidated.regions,
          modalities: csvValidated.modalities,
          worksWith: csvValidated.worksWith,
          reviewsCount: csvValidated.reviewsCount,
          rating: csvValidated.ratingAverage !== undefined || csvValidated.ratingCount !== undefined ? {
            average: csvValidated.ratingAverage || 0,
            count: csvValidated.ratingCount || 0
          } : undefined,
          nextAvailableDays: csvValidated.nextAvailableDays,
          workingHours: csvValidated.workingHoursMorning !== undefined || 
                       csvValidated.workingHoursMidday !== undefined || 
                       csvValidated.workingHoursEvening !== undefined || 
                       csvValidated.workingHoursWeekend !== undefined ? {
            morning: csvValidated.workingHoursMorning || false,
            midday: csvValidated.workingHoursMidday || false,
            evening: csvValidated.workingHoursEvening || false,
            weekend: csvValidated.workingHoursWeekend || false
          } : undefined,
          priceRange: csvValidated.priceRangeMin !== undefined || csvValidated.priceRangeMax !== undefined ? {
            minCZK: csvValidated.priceRangeMin || 0,
            maxCZK: csvValidated.priceRangeMax || 0
          } : undefined
        }

        // HARD VALIDATION: Check coordinates for in-person profiles
        const isInPerson = ['private', 'clinic', 'hospital', 'home_visits'].includes(csvValidated.practiceType)
        if (isInPerson) {
          try {
            validateCoordinatePair(csvValidated.latitude, csvValidated.longitude, `CSV row ${rowNumber}`)
          } catch (error) {
            invalidRows.push({
              rowNumber,
              data: row,
              errors: [error instanceof Error ? error.message : String(error)]
            })
            continue
          }
        }

        // Then validate the therapist record
        const therapistValidation = validateTherapistRecord(therapistRecord)
        if (therapistValidation.success) {
          validRows.push(therapistRecord)
        } else {
          invalidRows.push({
            rowNumber,
            data: row,
            errors: therapistValidation.errors || ['Unknown validation error']
          })
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          invalidRows.push({
            rowNumber,
            data: row,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          })
        } else {
          invalidRows.push({
            rowNumber,
            data: row,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          })
        }
      }
    }

    const totalRows = rows.length
    const validCount = validRows.length
    const invalidCount = invalidRows.length
    const successRate = totalRows > 0 ? (validCount / totalRows) * 100 : 0

    return {
      success: invalidCount === 0,
      validRows,
      invalidRows,
      summary: {
        totalRows,
        validRows: validCount,
        invalidRows: invalidCount,
        successRate
      }
    }
  } catch (error) {
    return {
      success: false,
      validRows: [],
      invalidRows: [{
        rowNumber: 0,
        data: {},
        errors: [error instanceof Error ? error.message : 'Failed to parse CSV']
      }],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 1,
        successRate: 0
      }
    }
  }
}

// Generate CSV template
export function generateCsvTemplate(): string {
  const headers = [
    'id',
    'fullName',
    'city',
    'latitude',
    'longitude',
    'practiceType',
    'acceptingNew',
    'yearsExperience',
    'pricePerSession',
    'languages',
    'specialties',
    'diagnosisTags',
    'tags',
    'bio',
    'profileImage',
    'clinicName',
    'address',
    'phone',
    'email',
    'website',
    'insuranceAccepted',
    'isVerified',
    'lastActive',
    'regions',
    'modalities',
    'worksWith',
    'reviewsCount',
    'ratingAverage',
    'ratingCount',
    'nextAvailableDays',
    'workingHoursMorning',
    'workingHoursMidday',
    'workingHoursEvening',
    'workingHoursWeekend',
    'priceRangeMin',
    'priceRangeMax'
  ]

  const exampleRow = [
    'therapist-001',
    'Dr. Jan Novák',
    'Praha',
    '50.0755',
    '14.4378',
    'private',
    'true',
    '10',
    '1200',
    'cs,en',
    'sports,spine',
    'lumbar_disc',
    'sports,spine',
    'Experienced physiotherapist specializing in sports injuries',
    'https://example.com/avatar.jpg',
    'FyzioCentrum',
    'Václavské náměstí 1, Praha',
    '+420123456789',
    'jan.novak@example.com',
    'https://example.com',
    'vzp,allianz',
    'true',
    '2024-01-15T10:00:00Z',
    'praha,stredocesky',
    'manual_therapy,exercise',
    'adults,athletes',
    '25',
    '4.5',
    '25',
    '7',
    'true',
    'true',
    'false',
    'false',
    '1000',
    '1500'
  ]

  return [headers.join(','), exampleRow.join(',')].join('\n')
}

// Export validation results to CSV
export function exportValidationResults(result: CsvImportResult): string {
  const headers = ['Row Number', 'Status', 'Errors']
  const rows: string[] = [headers.join(',')]

  // Add invalid rows
  result.invalidRows.forEach(invalid => {
    const errors = invalid.errors.join('; ')
    rows.push(`${invalid.rowNumber},INVALID,"${errors}"`)
  })

  // Add summary
  rows.push('')
  rows.push('SUMMARY')
  rows.push(`Total Rows,${result.summary.totalRows}`)
  rows.push(`Valid Rows,${result.summary.validRows}`)
  rows.push(`Invalid Rows,${result.summary.invalidRows}`)
  rows.push(`Success Rate,${result.summary.successRate.toFixed(2)}%`)

  return rows.join('\n')
}
