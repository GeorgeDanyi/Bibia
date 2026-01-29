import { NextRequest, NextResponse } from 'next/server'
import { setGeoDebugOverrides } from '@/lib/constants/geo'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const decay = Number(url.searchParams.get('decay'))
    const bonus = Number(url.searchParams.get('bonus'))
    setGeoDebugOverrides({ distanceDecayKm: isFinite(decay) && decay > 0 ? decay : undefined, homeVisitBonus: isFinite(bonus) && bonus >= 0 ? bonus : undefined })
    return NextResponse.json({ ok: true, decay, bonus })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 })
  }
}
