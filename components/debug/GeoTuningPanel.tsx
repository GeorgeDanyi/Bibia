'use client'

import { useEffect, useState } from 'react'

export default function GeoTuningPanel() {
  const [open, setOpen] = useState(false)
  const [decay, setDecay] = useState<number>(25)
  const [bonus, setBonus] = useState<number>(0.05)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('geo_tuning')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.decay === 'number') setDecay(parsed.decay)
        if (typeof parsed.bonus === 'number') setBonus(parsed.bonus)
      } catch {}
    }
  }, [])

  function apply() {
    if (typeof window === 'undefined') return
    localStorage.setItem('geo_tuning', JSON.stringify({ decay, bonus }))
    fetch(`/api/debug/geo?decay=${encodeURIComponent(decay)}&bonus=${encodeURIComponent(bonus)}`, { method: 'POST' }).catch(()=>{})
  }

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000 }}>
      <button onClick={() => setOpen(!open)} style={{ padding: 8, background: '#0ea5e9', color: '#fff', borderRadius: 6 }}>Geo Tuning</button>
      {open && (
        <div style={{ marginTop: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, width: 260 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Distance tuning</div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>distanceDecayKm</label>
          <input type="number" value={decay} onChange={e=>setDecay(Number(e.target.value))} min={1} step={1} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: 6, marginBottom: 8 }} />
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>homeVisitBonus</label>
          <input type="number" value={bonus} onChange={e=>setBonus(Number(e.target.value))} min={0} max={0.5} step={0.01} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 6, padding: 6, marginBottom: 12 }} />
          <button onClick={apply} style={{ padding: 8, background: '#16a34a', color: '#fff', borderRadius: 6, width: '100%' }}>Apply</button>
        </div>
      )}
    </div>
  )
}
