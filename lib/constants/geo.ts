export let DISTANCE_DECAY_KM = 25
export let HOME_VISIT_BONUS = 0.05

export function setGeoDebugOverrides(opts: { distanceDecayKm?: number; homeVisitBonus?: number }) {
  if (typeof opts.distanceDecayKm === 'number' && isFinite(opts.distanceDecayKm) && opts.distanceDecayKm > 0) {
    DISTANCE_DECAY_KM = opts.distanceDecayKm
  }
  if (typeof opts.homeVisitBonus === 'number' && isFinite(opts.homeVisitBonus) && opts.homeVisitBonus >= 0) {
    HOME_VISIT_BONUS = opts.homeVisitBonus
  }
}
