#!/usr/bin/env tsx

// Simple test for CSV import validation

import { validateCsvImport, generateCsvTemplate } from '../lib/validation/csv-import'

// Simple valid CSV with minimal fields
const simpleValidCsv = `id,fullName,city,latitude,longitude,practiceType,acceptingNew,yearsExperience,pricePerSession,languages,specialties,diagnosisTags,tags
therapist-001,Dr. Jan Novák,Praha,50.0755,14.4378,private,true,10,1200,cs,sports,lumbar_disc,sports
therapist-002,Dr. Marie Svobodová,Brno,49.1951,16.6068,clinic,false,15,1500,cs,neurological,stroke,neurological`

// Simple invalid CSV
const simpleInvalidCsv = `id,fullName,city,latitude,longitude,practiceType,acceptingNew,yearsExperience,pricePerSession,languages,specialties,diagnosisTags,tags
,Dr. Jan Novák,Praha,50.0755,14.4378,private,true,10,1200,cs,sports,lumbar_disc,sports
therapist-002,,Brno,999,16.6068,invalid_type,maybe,abc,xyz,invalid_lang,neurological,stroke,neurological`

async function testSimpleCsv() {
  console.log('🧪 Testing Simple CSV Import Validation\n')

  // Test 1: Generate template
  console.log('1. Testing CSV Template Generation...')
  const template = generateCsvTemplate()
  console.log(`   ✅ Template generated: ${template.split('\n').length} lines`)

  // Test 2: Valid CSV
  console.log('\n2. Testing Valid CSV...')
  const validResult = validateCsvImport(simpleValidCsv)
  console.log(`   ✅ Valid CSV result: ${validResult.success}`)
  console.log(`   📊 Summary: ${validResult.summary.validRows}/${validResult.summary.totalRows} valid`)
  console.log(`   📝 Invalid rows: ${validResult.invalidRows.length}`)

  // Test 3: Invalid CSV
  console.log('\n3. Testing Invalid CSV...')
  const invalidResult = validateCsvImport(simpleInvalidCsv)
  console.log(`   ✅ Invalid CSV result: ${!invalidResult.success}`)
  console.log(`   📊 Summary: ${invalidResult.summary.validRows}/${invalidResult.summary.totalRows} valid`)
  console.log(`   📝 Invalid rows: ${invalidResult.invalidRows.length}`)

  if (invalidResult.invalidRows.length > 0) {
    console.log('   🔍 Sample errors:')
    invalidResult.invalidRows.slice(0, 2).forEach((row, index) => {
      console.log(`      Row ${row.rowNumber}: ${row.errors.slice(0, 2).join(', ')}`)
    })
  }

  console.log('\n✅ Simple CSV testing completed!')
}

testSimpleCsv().catch(console.error)

