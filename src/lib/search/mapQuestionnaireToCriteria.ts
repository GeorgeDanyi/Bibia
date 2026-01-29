import { SearchCriteria, Availability, PracticeFilter } from '../../types/search'

export function mapQuestionnaireToCriteria(form: any): SearchCriteria {
  // DO NOT import UI; this is a pure function.
  // Read current field names from the existing form (e.g., form.city, form.radius, form.problems, form.time, form.consultationType, form.languages, form.preferExpert).
  
  const cityOrZip = (form.locationCity || form.postalCode || "").toString().trim();
  const radiusKm = Number(form.radius) > 0 ? Number(form.radius) : 30;

  // Problems -> conditions (normalize to slugs, OR semantics later)
  const conditions = Array.isArray(form.issueTags) ? form.issueTags
    .map((p: string) => p.trim().toLowerCase())
    .filter(Boolean) : [];

  // Time -> availability
  // If your UI has morning/afternoon/evening flags, map "soonest" to thresholds: today=0, next3<=3, next7<=7; else "any".
  const availability: Availability =
    form.urgencyPreference === "asap" ? "today" :
    form.urgencyPreference === "this-week" ? "next3" :
    form.urgencyPreference === "flexible" ? "next7" : "any";

  // Practice filter
  const practice: PracticeFilter =
    form.locationPreference === "online" ? "online" :
    form.locationPreference === "clinic" || form.locationPreference === "home" ? "inperson" : "any";

  // Languages
  const languages = Array.isArray(form.languages)
    ? form.languages.map((l: string) => l.trim().toLowerCase()).filter(Boolean)
    : [];

  const preferExpert = Boolean(form.preferExpert);

  return {
    location: { cityOrZip },
    radiusKm,
    conditions,
    availability,
    practice,
    languages,
    preferExpert,
  };
}
