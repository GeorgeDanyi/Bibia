// Taxonomy constants for Bibia platform

export const ISSUES = [
  "Bolesti zad / krku",
  "Bolesti kloubů", 
  "Bolesti svalů / šlach",
  "Bolesti hlavy / migrény",
  "Sportovní úraz",
  "Rehabilitace po operaci",
  "Rehabilitace po úrazu",
  "Těhotenství / po porodu",
  "Dlouhodobé onemocnění / diagnóza",
  "Jiné potíže"
] as const;

export const DIAGNOSES = [
  "Bechtěrev",
  "Skolióza", 
  "Výhřez ploténky",
  "Roztroušená skleróza",
  "Osteoporóza",
  "Po operaci menisku",
  "Po úrazu kotníku"
] as const;

export type CityEntry = { city: string; region: string };

export const CITIES: ReadonlyArray<CityEntry> = [
  { city: "Praha", region: "Praha" },
  { city: "Brno", region: "Jihomoravský" },
  { city: "Ostrava", region: "Moravskoslezský" },
  { city: "Plzeň", region: "Plzeňský" },
  { city: "Liberec", region: "Liberecký" },
  { city: "Olomouc", region: "Olomoucký" },
  { city: "České Budějovice", region: "Jihočeský" },
  { city: "Hradec Králové", region: "Královéhradecký" },
  { city: "Pardubice", region: "Pardubický" },
  { city: "Ústí nad Labem", region: "Ústecký" },
  { city: "Zlín", region: "Zlínský" },
  { city: "Jihlava", region: "Vysočina" },
  { city: "Karlovy Vary", region: "Karlovarský" },
  { city: "Kladno", region: "Středočeský" },
  { city: "Most", region: "Ústecký" },
  { city: "Opava", region: "Moravskoslezský" },
  { city: "Frýdek-Místek", region: "Moravskoslezský" },
  { city: "Karviná", region: "Moravskoslezský" },
  { city: "Teplice", region: "Ústecký" },
  { city: "Děčín", region: "Ústecký" },
  { city: "Jablonec nad Nisou", region: "Liberecký" },
  { city: "Mladá Boleslav", region: "Středočeský" },
  { city: "Prostějov", region: "Olomoucký" },
  { city: "Přerov", region: "Olomoucký" },
  { city: "Česká Lípa", region: "Liberecký" },
  { city: "Třebíč", region: "Vysočina" },
  { city: "Třinec", region: "Moravskoslezský" },
  { city: "Kolín", region: "Středočeský" },
  { city: "Tábor", region: "Jihočeský" },
  { city: "Znojmo", region: "Jihomoravský" },
  { city: "Příbram", region: "Středočeský" }
] as const;

export const MODALITIES = [
  "DNS",
  "McKenzie",
  "Visceral",
  "Mulligan",
  "Kaltenborn",
  "Cyriax",
  "PNF",
  "Bobath",
  "Vojta",
  "Kinesio Taping",
  "Dry Needling",
  "Manuální terapie",
  "Mobilizace",
  "Manipulace"
] as const;

export const WORKS_WITH = [
  "těhotné",
  "sportovci", 
  "senioři",
  "děti",
  "dospívající",
  "profesionální sportovci",
  "rekreanti",
  "pracovní úrazy",
  "dopravní nehody"
] as const;

export const LANGUAGES = [
  "cs", // Czech
  "en", // English
  "de", // German
  "sk", // Slovak
  "pl", // Polish
  "ru", // Russian
  "fr", // French
  "es"  // Spanish
] as const;

export const REGIONS = [
  "Praha",
  "Středočeský",
  "Jihočeský", 
  "Plzeňský",
  "Karlovarský",
  "Ústecký",
  "Liberecký",
  "Královéhradecký",
  "Pardubický",
  "Vysočina",
  "Jihomoravský",
  "Olomoucký",
  "Zlínský",
  "Moravskoslezský"
] as const;

// Type exports for TypeScript
export type IssueType = typeof ISSUES[number];
export type DiagnosisType = typeof DIAGNOSES[number];
export type CityType = (typeof CITIES)[number]['city'];
export type ModalityType = typeof MODALITIES[number];
export type WorksWithType = typeof WORKS_WITH[number];
export type LanguageType = typeof LANGUAGES[number];
export type RegionType = typeof REGIONS[number];
