import type { Answers } from "@/lib/types/answers";

interface ResultsLike {
  total?: number;
  results?: any[] | null;
}

/**
 * Helper to decide when to show the strict-gender zero-results notice.
 *
 * Conditions:
 * - total/resultsCount === 0
 * - AND answers.strictGender === true
 * - AND answers.genderPreference is "female" or "male" (not "any")
 */
export function shouldShowStrictGenderZeroResultsNotice(
  results: ResultsLike | null | undefined,
  answers: Answers | null | undefined
): boolean {
  if (!results || !answers) return false;

  const explicitTotal =
    typeof results.total === "number" ? results.total : undefined;
  const derivedCount = Array.isArray(results.results)
    ? results.results.length
    : undefined;

  const totalCount =
    typeof explicitTotal === "number"
      ? explicitTotal
      : typeof derivedCount === "number"
      ? derivedCount
      : 0;

  const hasStrictGender = answers.strictGender === true;
  const genderIsSpecific =
    answers.genderPreference === "female" || answers.genderPreference === "male";

  return totalCount === 0 && hasStrictGender && genderIsSpecific;
}






