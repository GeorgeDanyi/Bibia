import React from 'react'

type ScoreBreakdown = {
  diagnosis: number
  availability: number
  distance: number
  language: number
  prefs: number
  profile: number
}

export function DebugScoreOverlay({ score, breakdown }: { score: number; breakdown: ScoreBreakdown }) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, lineHeight: 1.3 }}>
      <div><strong>{score}</strong></div>
      <div>diag: {(breakdown.diagnosis).toFixed(2)}</div>
      <div>avail: {(breakdown.availability).toFixed(2)}</div>
      <div>dist: {(breakdown.distance).toFixed(2)}</div>
      <div>lang: {(breakdown.language).toFixed(2)}</div>
      <div>prefs: {(breakdown.prefs).toFixed(2)}</div>
      <div>profile: {(breakdown.profile).toFixed(2)}</div>
    </div>
  )
}


