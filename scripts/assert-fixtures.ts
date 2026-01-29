/*
 Assert fixture integrity for physio-kladno-1
*/
import fs from 'fs'
import path from 'path'

function readJson<T=any>(p: string): T | null { try { return JSON.parse(fs.readFileSync(p,'utf8')) as T } catch { return null } }

function main() {
  const root = path.resolve(__dirname, '..')
  const paths = [
    path.resolve(root, 'data/therapists.normalized.json'),
    path.resolve(root, 'data/therapists.json'),
    path.resolve(root, 'data/therapists.synthetic.json'),
  ]
  let data: any[] = []
  for (const p of paths) {
    const j = readJson<any[]>(p)
    if (Array.isArray(j)) data = data.concat(j)
  }
  const t = data.find(x => String(x.id) === 'physio-kladno-1')
  if (!t) {
    console.error('physio-kladno-1 not found. Hint: add synthetic profile with clinic, male, cs, location in Kladno.')
    process.exit(1)
  }
  const meeting_modes: string[] = Array.isArray(t.meeting_modes) ? t.meeting_modes : (Array.isArray(t.meeting_types) ? t.meeting_types.map((m:string)=> m==='ordinace'?'clinic':m==='dojizdeni'?'home_visit':'online') : [])
  if (!(meeting_modes.includes('clinic'))) {
    console.error('Meeting modes must include clinic. Fix meeting_modes for physio-kladno-1.')
    process.exit(1)
  }
  const gender = String(t.gender || t.therapistGender || '').toLowerCase()
  if (!(gender.includes('male') || gender.includes('mu'))) {
    console.error('Gender must be male. Fix gender for physio-kladno-1.')
    process.exit(1)
  }
  const langs: string[] = Array.isArray(t.languages) ? t.languages.map((x:any)=>String(x)) : []
  if (!(langs.includes('cs') || langs.includes('cestina'))) {
    console.error('Languages must include cs. Fix languages for physio-kladno-1.')
    process.exit(1)
  }
  const locs: any[] = Array.isArray(t.locations) ? t.locations : []
  const hasKladno = locs.some(l => typeof l.city === 'string' && l.city.toLowerCase().includes('kladno'))
  const validCoords = locs.some(l => Number.isFinite(l.lat) && Number.isFinite(l.lon) && l.lat >= 48.5 && l.lat <= 51.1 && l.lon >= 12.0 && l.lon <= 18.9)
  if (!hasKladno || !validCoords) {
    console.error('Location must include Kladno with valid CZ coords. Fix locations for physio-kladno-1.')
    process.exit(1)
  }
  console.log('Fixture OK: physio-kladno-1')
}

main()


