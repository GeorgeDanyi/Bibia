import { SearchCriteria, Availability, PracticeFilter } from '../../types/search'

export function deriveCriteriaFromURL(searchParams: URLSearchParams): SearchCriteria {
  const city = (searchParams.get("city") || "").trim();
  const radiusKm = Number(searchParams.get("radiusKm")) || 30;
  const conditions = (searchParams.get("conditions") || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const availability = (searchParams.get("availability") as Availability) || "any";
  const practice = (searchParams.get("practice") as PracticeFilter) || "any";
  const languages = (searchParams.get("languages") || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const preferExpert = searchParams.get("preferExpert") === "true";
  
  return {
    location: { cityOrZip: city },
    radiusKm, 
    conditions, 
    availability, 
    practice, 
    languages, 
    preferExpert
  };
}
