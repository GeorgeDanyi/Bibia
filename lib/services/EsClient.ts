import { Client } from '@elastic/elasticsearch'

let client: Client | null = null

export function getEsClient(): Client | null {
  const node = process.env.ES_URL
  if (!node) return null
  if (!client) client = new Client({ node })
  return client
}

export async function searchTherapistsES(params: {
  location?: { lat: number; lon: number }
  meetingType?: 'ordinace'|'dojizdeni'|'online'
  language?: string
  diagnosisId?: string
  wantsInsurance?: boolean
  ageGroup?: 'child'|'adult'|'senior'
  limit?: number
}): Promise<any[]> {
  const es = getEsClient()
  if (!es) return []
  const index = process.env.ES_INDEX || 'therapists'
  const must: any[] = []
  if (params.meetingType) must.push({ term: { meeting_types: params.meetingType } })
  if (params.language) must.push({ term: { languages: params.language } })
  if (params.diagnosisId) must.push({ term: { specialties: params.diagnosisId } })
  if (params.wantsInsurance) must.push({ term: { accepts_insurance: true } })
  if (params.ageGroup) must.push({ term: { age_groups: params.ageGroup } })

  const functions: any[] = []
  if (params.location && params.meetingType !== 'online') {
    functions.push({
      gauss: {
        location: {
          origin: `${params.location.lat},${params.location.lon}`,
          scale: '25km',
          offset: '0km',
          decay: 0.5
        }
      }, weight: 1
    })
  }
  functions.push({ field_value_factor: { field: 'profile_score', factor: 1, missing: 0.5 }, weight: 0.2 })
  functions.push({ field_value_factor: { field: 'verified', factor: 1 }, weight: 0.1 })
  functions.push({ field_value_factor: { field: 'reviews_count', factor: 0.003, missing: 0 }, weight: 0.2 })

  const body: any = {
    size: Math.max(12, params.limit || 12),
    query: {
      function_score: {
        query: { bool: { must } },
        functions,
        score_mode: 'sum',
        boost_mode: 'sum'
      }
    }
  }

  const resp = await es.search({ index, body })
  const hits = (resp.hits as any).hits || []
  return hits.map((h: any) => ({ id: h._id, ...h._source, _es_score: h._score }))
}


