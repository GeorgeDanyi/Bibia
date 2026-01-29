import { CZ_CITIES } from '../data/cz_cities.ts'
import fs from 'fs'
import path from 'path'

function slugify(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function deterministicChoice<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length]
}

function generate() {
  const out: any[] = []
  for (let i = 0; i < CZ_CITIES.length; i++) {
    const c = CZ_CITIES[i]
    const citySlug = slugify(c.city)
    const gender = (i % 2 === 0) ? 'male' : 'female'
    const langs = ['cs']
    if (i % 9 === 0) langs.push('en')
    else if (i % 7 === 0) langs.push('uk')
    const patient_groups = (i % 5 === 0) ? ['adult','senior','child'] : ['adult','senior']
    const insurers = (i % 6 === 0) ? [] : ['111','201']
    const specialties = ['lower_limb','ankle','knee']
    const commonDx = deterministicChoice(['injury','post_surgery','lumbago'], i)
    const specialized = (i % 10 === 0) ? deterministicChoice(['ankylosing_spondylitis','multiple_sclerosis','stroke'], i) : null
    const weekly: any = { Mon: ['morning','late_morning','afternoon'], Tue: ['morning','late_morning','afternoon'], Wed: ['morning','late_morning','afternoon'], Thu: ['morning','late_morning','afternoon'], Fri: ['morning','late_morning','afternoon'] }
    if (i % 3 === 0) { weekly.Mon.push('evening'); weekly.Wed.push('evening') }
    const next_in = 3 + (i % 12)

    const base = {
      id: `physio-${citySlug}-1`,
      full_name: `${gender === 'male' ? 'Mgr. Jan' : 'Mgr. Jana'} ${c.city}`,
      gender,
      accepting_new: true,
      meeting_modes: ['clinic'],
      base_city: c.city,
      locations: [{ city: c.city, lat: c.lat, lon: c.lon, barrier_free: (i % 4 === 0) }],
      service_radius_km: 0,
      languages: langs,
      insurers,
      specialties,
      diagnosis_expertise: specialized ? [commonDx, specialized] : [commonDx],
      patient_groups,
      weekly_availability: weekly,
      rating: { average: 4.2 + ((i % 5) * 0.1), count: 5 + (i % 20) },
      next_available_in_days: next_in
    }
    out.push(base)

    if (i % 8 === 0) {
      const gender2 = (gender === 'male') ? 'female' : 'male'
      out.push({
        ...base,
        id: `physio-${citySlug}-2`,
        full_name: `${gender2 === 'male' ? 'Bc. Petr' : 'Bc. Petra'} ${c.city}`,
        gender: gender2,
        languages: langs.includes('en') ? langs : [...langs, 'en'],
        insurers: insurers.length ? insurers : ['111'],
        next_available_in_days: next_in + 2
      })
    }
  }
  const target = path.resolve(process.cwd(), 'data/therapists.synthetic.json')
  fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8')
  console.log(`Wrote ${out.length} synthetic therapists -> ${target}`)
}

generate()
