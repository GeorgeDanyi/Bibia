import { QuestionnaireAnswers, TherapistMatch } from "@/lib/types/questionnaire"
import { processQuestionnaire } from "@/lib/utils/query"
// Removed loadTherapists import - will use API endpoint instead

// loadTherapistsViaAPI function removed - therapists are now loaded server-side only
import { matchTherapists } from "@/lib/utils/match"
import { splitResults } from "@/lib/utils/splitResults"

export type SearchParams = {
  answers: QuestionnaireAnswers
  maxDistanceKm: number
}

export async function searchTherapists({ answers, maxDistanceKm }: SearchParams): Promise<{ matches: TherapistMatch[]; bestNearby: any[]; closestAlt: any[] }> {
  // This function is deprecated - use the search API instead
  // Therapists are now loaded server-side only
  return { matches: [], bestNearby: [], closestAlt: [] }
}


