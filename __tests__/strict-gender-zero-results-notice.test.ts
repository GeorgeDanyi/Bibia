import { shouldShowStrictGenderZeroResultsNotice } from "@/lib/utils/strictGenderZeroResults";
import type { Answers } from "@/lib/types/answers";

function makeAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    city: "",
    radiusKm: 30,
    meetingType: "any",
    problemArea: "",
    ageGroup: "adult",
    genderPreference: "any",
    strictGender: false,
    barrierFree: false,
    languages: [],
    insuranceMode: "insurance",
    timesOfDay: [],
    weekdays: [],
    ...overrides,
  };
}

describe("shouldShowStrictGenderZeroResultsNotice", () => {
  it("returns false when there are results", () => {
    const answers = makeAnswers({
      genderPreference: "female",
      strictGender: true,
    });

    const results = { total: 3, results: [{}, {}, {}] };

    expect(
      shouldShowStrictGenderZeroResultsNotice(results, answers)
    ).toBe(false);
  });

  it("returns false when answers are missing", () => {
    const results = { total: 0, results: [] };

    expect(
      shouldShowStrictGenderZeroResultsNotice(results, null)
    ).toBe(false);
  });

  it("returns false when genderPreference is 'any' even if strictGender is true and no results", () => {
    const answers = makeAnswers({
      genderPreference: "any",
      strictGender: true,
    });

    const results = { total: 0, results: [] };

    expect(
      shouldShowStrictGenderZeroResultsNotice(results, answers)
    ).toBe(false);
  });

  it("returns true when total is 0, strictGender is true and genderPreference is female", () => {
    const answers = makeAnswers({
      genderPreference: "female",
      strictGender: true,
    });

    const results = { total: 0, results: [] };

    expect(
      shouldShowStrictGenderZeroResultsNotice(results, answers)
    ).toBe(true);
  });

  it("returns true when only results length is 0, strictGender is true and genderPreference is male", () => {
    const answers = makeAnswers({
      genderPreference: "male",
      strictGender: true,
    });

    const results = { results: [] };

    expect(
      shouldShowStrictGenderZeroResultsNotice(results, answers)
    ).toBe(true);
  });
});

