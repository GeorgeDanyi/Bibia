export type Availability = "today"|"next3"|"next7"|"any";

export type PracticeFilter = "inperson"|"online"|"any";

export interface SearchCriteria {
  location: { cityOrZip?: string; lat?: number; lng?: number };
  radiusKm: number;              // default 30
  conditions: string[];          // from our "problems" fields; lowercased slugs
  availability: Availability;    // from time-of-day/soonest answers -> see mapping below
  practice: PracticeFilter;      // from in-person/online choice
  languages: string[];           // multi, lowercased ISO ("cs","en","ru")
  preferExpert: boolean;         // from the existing toggle
}
