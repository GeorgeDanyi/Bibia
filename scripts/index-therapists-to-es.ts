#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { Client } from '@elastic/elasticsearch'
import { ensureTherapistCoords } from '@/lib/services/therapistGeo'
import { validateTherapistCoordinates } from '@/lib/validation/coordinates'

const ES_URL = process.env.ES_URL || 'http://localhost:9200'
const INDEX = process.env.ES_INDEX || 'therapists'

function toAvailabilityBuckets(isoList: string[]) {
  const now = Date.now()
  const next = isoList && isoList.length > 0 ? new Date(isoList[0]).getTime() : null
  const buckets: string[] = []
  if (next) {
    const diffH = Math.max(0, (next - now) / (3600*1000))
    if (diffH <= 72) buckets.push('lt_72h')
    if (diffH <= 24*7) buckets.push('lt_1w')
    if (diffH <= 24*30) buckets.push('lt_1m')
  }
  return { next_available: next ? new Date(next).toISOString() : null, buckets }
}

async function ensureIndex(client: Client) {
  const exists = await client.indices.exists({ index: INDEX })
  if (exists) return
  await client.indices.create({
    index: INDEX,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
          city: { type: 'keyword' },
          location: { type: 'geo_point' },
          meeting_types: { type: 'keyword' },
          service_radius_km: { type: 'integer' },
          languages: { type: 'keyword' },
          specialties: { type: 'keyword' },
          age_groups: { type: 'keyword' },
          accepts_insurance: { type: 'boolean' },
          availability: { type: 'date', format: 'date_time||strict_date_optional_time' },
          next_available: { type: 'date', format: 'date_time||strict_date_optional_time' },
          availability_buckets: { type: 'keyword' },
          profile_score: { type: 'half_float' },
          reviews_count: { type: 'integer' },
          verified: { type: 'boolean' },
          bio: { type: 'text' },
          created_at: { type: 'date', format: 'date_time||strict_date_optional_time' },
          metadata: {
            properties: {
              has_photos: { type: 'boolean' },
              education: { type: 'keyword' },
              barrier_free: { type: 'boolean' }
            }
          }
        }
      }
    }
  })
}

async function main() {
  const client = new Client({ node: ES_URL })
  await ensureIndex(client)

  const file = path.join(process.cwd(), 'data', 'therapists.json')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))

  // HARD VALIDATION: Validate coordinates before processing
  console.log('Validating therapist coordinates...')
  const { valid, invalid } = validateTherapistCoordinates(data)
  
  if (invalid.length > 0) {
    console.error(`\n❌ HARD VALIDATION FAILED: ${invalid.length} therapists have invalid coordinates:`)
    invalid.forEach(({ therapist, error }) => {
      console.error(`  - ID: ${therapist.id || 'unknown'}, Error: ${error}`)
    })
    console.error('\n🚫 Aborting ingestion due to coordinate validation failures.')
    process.exit(1)
  }
  
  console.log(`✅ Coordinate validation passed: ${valid.length} therapists validated`)

  const operations: any[] = []
  for (const t of valid) {
    const geo = await ensureTherapistCoords({ id: t.id, city: t.city, postalCode: t.postalCode, address: t.address, lat: t.lat, lng: t.lng })
    const { next_available, buckets } = toAvailabilityBuckets(t.availability || [])
    operations.push({ index: { _index: INDEX, _id: t.id } })
    operations.push({
      id: t.id,
      name: t.name,
      city: t.city,
      location: { lat: geo.lat, lon: geo.lng },
      meeting_types: t.meeting_types,
      service_radius_km: t.service_radius_km,
      languages: t.languages,
      specialties: t.specialties,
      age_groups: t.age_groups,
      accepts_insurance: t.accepts_insurance,
      availability: t.availability,
      next_available,
      availability_buckets: buckets,
      profile_score: t.profile_score,
      reviews_count: t.reviews_count,
      verified: t.verified,
      bio: t.bio,
      created_at: t.created_at,
      metadata: t.metadata
    })
  }

  if (operations.length) {
    const res = await client.bulk({ refresh: true, operations })
    if (res.errors) {
      console.error('Bulk indexing had errors')
    } else {
      console.log(`Indexed ${operations.length/2} therapists into ${INDEX}`)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
