import { NextRequest, NextResponse } from 'next/server'
import { DISTANCE_DECAY_KM, HOME_VISIT_BONUS, setGeoDebugOverrides } from '@/lib/constants/geo'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  return NextResponse.json({ distanceDecayKm: DISTANCE_DECAY_KM, homeVisitBonus: HOME_VISIT_BONUS })
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const distanceDecayKm = typeof body.distanceDecayKm === 'number' ? body.distanceDecayKm : undefined
    const homeVisitBonus = typeof body.homeVisitBonus === 'number' ? body.homeVisitBonus : undefined
    setGeoDebugOverrides({ distanceDecayKm, homeVisitBonus })
    return NextResponse.json({ distanceDecayKm: DISTANCE_DECAY_KM, homeVisitBonus: HOME_VISIT_BONUS })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}


