## Matching explainability metadata

This document describes the explainability fields returned by the canonical matching engine.  
They are available in `MatchResult.matches[]` from `lib/matching/matching-engine.ts` and are also exposed from the search API under `matchResults`.

### Reason codes (`MatchReason.code`)

- **MEETING_TYPE_MATCH**: Therapist supports the requested meeting type (clinic / home visit / online).
- **DISTANCE_CLOSE**: Therapist is geographically close to the user (in-person searches only).
- **AGE_GROUP_MATCH**: Therapist works with the user’s requested age group (child / senior).
- **BARRIER_FREE_MATCH**: Therapist offers a barrier-free clinic and the user requested it.
- **GENDER_PREFERRED**: Therapist matches a non-strict preferred gender.
- **LANGUAGE_MATCH**: Therapist speaks at least one of the user’s preferred languages.
- **SPECIALTY_MATCH**: Therapist’s specialties / diagnosis expertise match the user’s condition or issues.
- **ASAP_AVAILABILITY**: Therapist has upcoming availability when the user prefers “as soon as possible”.
- **PROFILE_QUALITY**: Therapist has a well-completed profile (profile completeness score is high).

Each reason contains:

- **code**: Stable machine-readable identifier (see list above).
- **labelCs**: Short Czech label ready for UI display.
- **detailCs** *(optional)*: Czech detail text (e.g. formatted distance).
- **weight** *(optional)*: Approximate points contributed to the total score for this aspect.

### Score breakdown (`ScoreBreakdown`)

For each match the engine computes a numeric breakdown:

- **specialties**: Points from specialty / diagnosis matching (problem fit).
- **languages**: Points from language overlap between user and therapist.
- **timePreference**: Points from time preference (e.g. ASAP availability).
- **gender**: Points from gender preference when non-strict, or neutral baseline when strict / any.
- **distance**: Points based on geographic distance (only for in-person searches).
- **profileScore**: Points based on therapist profile completeness.
- **genderPenalty**: Additional down-weight applied when therapist does *not* match a non-strict preferred gender.
- **totalScore**: Final numeric score after all components and penalties, used for ranking.

`totalScore` is exactly the value used to sort matches in `findMatches`, so UI can safely display or debug it alongside the reasons.

### `matchPercent` calibration

The engine also exposes a normalized **`matchPercent`** field per match:

- Computed from `totalScore` using a fixed calibration constant:  
  \\( matchPercent = \mathrm{clamp}_{0..100}(\mathrm{round}((\max(0, totalScore) / 60) \times 100)) \\)
- The denominator **60** reflects the approximate maximum achievable score from all components.
- Values are **clamped to the 0–100 range** and are **monotonic** with `totalScore`:
  - If score A ≥ score B, then percent A ≥ percent B.
- The calibration is chosen so that “typical good matches” land well above 50 %, while weaker / fallback matches land lower but still remain interpretable.

This percent is intended purely for UI presentation (e.g. progress bars or badges); any ranking logic should continue to rely on the raw `totalScore`.






