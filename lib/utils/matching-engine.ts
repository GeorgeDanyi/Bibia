import { Therapist, QuestionnaireAnswers, TherapistMatch, GeoPoint } from '../types/questionnaire';
import { nearestClinicDistance } from '@/lib/utils/geo'
import { MOCK_THERAPISTS } from '../data/therapists';

// Calculate distance between two points using Haversine formula
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Convert questionnaire answers to matching criteria
export interface MatchingCriteria {
  issues?: string[];
  diagnosisTags?: string[];
  gender?: 'male' | 'female' | 'any';
  languages?: string[];
  experiences?: string[];
  coordinates?: GeoPoint;
  maxDistance?: number;
  timePreferences?: string[];
  coverageType?: string;
  // Added controls
  sessionMode?: 'in_person' | 'online' | 'any';
  availabilityBucket?: 'morning'|'lateMorning'|'afternoon'|'evening'|'weekend'|'asap';
  nextDaysMax?: number; // pre-filter therapists without availability in next X days
  // Problem area matching
  problemAreas?: string[]; // From conditionsMain and conditionsDetail
}

export function answersToCriteria(answers: QuestionnaireAnswers): MatchingCriteria {
  const criteria: MatchingCriteria = {};

  // Location and distance
  if (answers.location?.coordinates) {
    criteria.coordinates = answers.location.coordinates;
    
    // Convert distance preference to max distance
    const distanceMap: Record<string, number> = {
      '3km': 3,
      '5km': 5,
      '10km': 10,
      '20km': 20,
      'any': 50
    };
    criteria.maxDistance = distanceMap[answers.distancePreference || 'any'] || 50;
  }

  // Issues and diagnosis
  if (answers.issueTags && answers.issueTags.length > 0) {
    criteria.issues = answers.issueTags;
  }
  if ((answers as any).diagnosis) {
    criteria.diagnosisTags = [(answers as any).diagnosis];
  }

  // Problem areas from conditionsMain and conditionsDetail
  const problemAreas: string[] = [];
  if ((answers as any).conditionsMain && Array.isArray((answers as any).conditionsMain)) {
    problemAreas.push(...(answers as any).conditionsMain);
  }
  if ((answers as any).conditionsDetail && Array.isArray((answers as any).conditionsDetail)) {
    problemAreas.push(...(answers as any).conditionsDetail);
  }
  if (problemAreas.length > 0) {
    criteria.problemAreas = problemAreas;
  }

  // Preferences
  if ((answers as any).gender) {
    criteria.gender = (answers as any).gender;
  }
  if ((answers as any).languages && (answers as any).languages.length > 0) {
    criteria.languages = (answers as any).languages;
  }
  if ((answers as any).experiences && (answers as any).experiences.length > 0) {
    criteria.experiences = (answers as any).experiences;
  }

  // Time preferences
  if (answers.timePreferences && answers.timePreferences.length > 0) {
    criteria.timePreferences = answers.timePreferences;
  }

  // Coverage type
  if (answers.coverageType) {
    criteria.coverageType = answers.coverageType;
  }

  // Optional session mode and buckets (if present in answers schema)
  if ((answers as any).sessionMode) {
    criteria.sessionMode = (answers as any).sessionMode;
  } else {
    criteria.sessionMode = 'any';
  }
  if ((answers as any).timePreferences && (answers as any).timePreferences.length > 0) {
    criteria.availabilityBucket = ((answers as any).timePreferences[0]) as any;
  }
  criteria.nextDaysMax = (answers as any).nextDaysMax ?? 30;

  return criteria;
}

// Strict filters - must pass ALL to be included
export function passesStrictFilters(therapist: Therapist, criteria: MatchingCriteria): boolean {
  // Gender filter (if specified and not 'any')
  if (criteria.gender && criteria.gender !== 'any') {
    if (therapist.gender && therapist.gender !== criteria.gender) {
      return false;
    }
  }

  // Languages - therapist must have ANY of the selected languages
  if (criteria.languages && criteria.languages.length > 0) {
    if (!therapist.languages || therapist.languages.length === 0) return false;
    const hasMatchingLanguage = criteria.languages.some(lang => 
      therapist.languages!.includes(lang)
    );
    if (!hasMatchingLanguage) return false;
  }

  // Experiences - therapist must have ANY of the selected experiences
  if (criteria.experiences && criteria.experiences.length > 0) {
    const hasMatchingExperience = criteria.experiences.some(exp => 
      therapist.specializations.includes(exp)
    );
    if (!hasMatchingExperience) return false;
  }

  return true;
}

// Full filters - includes distance and time constraints
export function passesFullFilters(therapist: Therapist, criteria: MatchingCriteria): boolean {
  if (!passesStrictFilters(therapist, criteria)) return false;

  // Distance filter (supports multiple clinic locations if provided)
  if (criteria.coordinates && criteria.maxDistance) {
    const clinics: { lat: number; lon: number }[] = (therapist as any).locations || (therapist as any).clinics || []
    let distance = 0
    if (clinics.length > 0) {
      distance = nearestClinicDistance({ lat: criteria.coordinates.lat, lon: criteria.coordinates.lng }, clinics as any) || Infinity
    } else {
      distance = calculateDistance(criteria.coordinates, therapist.location)
    }
    therapist.distanceKm = distance
    if (distance > criteria.maxDistance) return false
  }

  // Mode filter (if requested explicitly)
  if (criteria.sessionMode && criteria.sessionMode !== 'any') {
    const modes: string[] = ((therapist as any).offers || (therapist as any).modes || []);
    if (!modes.includes(criteria.sessionMode)) return false;
  }

  // Availability pre-filter: must have a slot within next X days
  const daysMax = criteria.nextDaysMax ?? 30;
  if (daysMax > 0) {
    const next = (therapist as any).nextSlots?.[0]?.startISO as string | undefined;
    if (!next) return false;
    const now = new Date();
    const date = new Date(next);
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays > daysMax) return false;
  }

  // Time availability filter
  if (criteria.timePreferences && criteria.timePreferences.length > 0) {
    const timeKeyToLabel: Record<string, string> = {
      morning: 'ráno',
      lateMorning: 'dopoledne', 
      afternoon: 'odpoledne',
      evening: 'večer',
      weekend: 'víkend',
      asap: 'asap'
    };
    
    const needs = criteria.timePreferences.map(k => timeKeyToLabel[k] || k);
    const hasMatchingTime = (therapist as any).availability?.some((av: string) => needs.includes(av));
    if (!hasMatchingTime) return false;
  }

  return true;
}

// Compute composite score with proper weights
export function computeCompositeScore(therapist: Therapist, criteria: MatchingCriteria): { score: number; breakdown: Array<{label: string, value: number}> } {
  const overlapCount = (a: string[], b: string[]) => {
    const setA = new Set(a);
    return b.filter(x => setA.has(x)).length;
  };

  // Similarity map for related diagnoses
  const DIAG_SIMILARITY: Record<string, string[]> = {
    cervical_radiculopathy: ['neck_tension', 'spondylosis'],
    lumbar_disc_herniation: ['lower_back_pain_non_spec', 'sciatica', 'spondylosis'],
    shoulder_impingement: ['frozen_shoulder', 'tendinopathy'],
  };

  // Calculate overlaps
  const issuesOverlap = criteria.issues ? overlapCount(therapist.specializations || [], criteria.issues) : 0;
  // Prefer explicit diagnoses list on therapist, fallback to specializations keywords
  const therapistDiagnoses: string[] = (therapist as any).diagnoses || therapist.specializations || []
  let diagScoreNorm = 0; // 0..1
  if (criteria.diagnosisTags && criteria.diagnosisTags.length > 0) {
    const exact = overlapCount(therapistDiagnoses, criteria.diagnosisTags);
    if (exact > 0) {
      diagScoreNorm = 1; // exact tag present
    } else {
      // check similarity
      const related = criteria.diagnosisTags.some(tag => {
        const rel = DIAG_SIMILARITY[tag] || [];
        return rel.some(r => therapistDiagnoses.includes(r));
      });
      diagScoreNorm = related ? 0.6 : 0;
    }
  }
  const expOverlap = criteria.experiences ? overlapCount(therapist.specializations, criteria.experiences) : 0;
  const langOverlap = criteria.languages && therapist.languages ? overlapCount(therapist.languages, criteria.languages) : 0;
  
  // Problem area matching - check therapist specializations against selected problem areas
  const problemAreaOverlap = criteria.problemAreas ? overlapCount(therapist.specializations || [], criteria.problemAreas) : 0;

  // Normalize to 0-1
  const norm = (x: number) => x > 0 ? 1 : 0;
  const nIssues = norm(issuesOverlap);
  const nDiag = diagScoreNorm; // already normalized
  const nExp = norm(expOverlap);
  const nLang = norm(langOverlap);
  const nGender = criteria.gender && criteria.gender !== 'any' ? (therapist.gender ? 1 : 0) : 1;
  
  // Problem area scoring - if no problem areas selected, give neutral score
  const nProblemAreas = criteria.problemAreas && criteria.problemAreas.length > 0 
    ? norm(problemAreaOverlap) 
    : 0.5; // Neutral score when no problem areas selected

  // Distance scoring S_dist (0..1) with smooth damping after 5 km
  const distanceScore = (km: number | null | undefined, k = 15): number => {
    if (km === null || km === undefined || isNaN(km)) return 0.5
    if (km <= 5) return 1
    const dx = Math.max(0, km - 5)
    return 1 / (1 + (dx / k))
  }
  let nDistance = distanceScore((therapist as any).distanceKm ?? null)
  // If user explicitly chose online mode, make distance irrelevant but only for online-capable therapists
  const therapistModes: string[] = ((therapist as any).offers || (therapist as any).modes || [])
  if (criteria.sessionMode === 'online') {
    nDistance = therapistModes.includes('online') ? 1 : 0
  }

  // Rating boost (0-1)
  const nRating = therapist.rating ? Math.min(1, therapist.rating.avg / 5) : 0.5;

  // Availability score: sooner is better (inverse days), plus bucket boost
  let nAvailability = 0.5;
  let daysUntil = 999;
  if ((therapist as any).nextSlots && (therapist as any).nextSlots.length > 0) {
    const nextISO = (therapist as any).nextSlots[0].startISO as string;
    const now = new Date();
    const date = new Date(nextISO);
    daysUntil = Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    // Map 0 days -> 1, 30 days -> ~0, clamp 0..1
    nAvailability = Math.max(0, Math.min(1, 1 - (daysUntil / (criteria.nextDaysMax ?? 30))));
  }
  // Bucket boost if requested time bucket matches therapist availability labels
  if (criteria.availabilityBucket) {
    const timeKeyToLabel: Record<string, string> = {
      morning: 'ráno',
      lateMorning: 'dopoledne',
      afternoon: 'odpoledne',
      evening: 'večer',
      weekend: 'víkend',
      asap: 'asap'
    };
    const need = timeKeyToLabel[criteria.availabilityBucket] || criteria.availabilityBucket;
    const hasBucket = (therapist as any).availability?.some((av: string) => av === need);
    if (hasBucket) nAvailability = Math.min(1, nAvailability + 0.15);
  }

  // Weighted composite score
  // Preference alignment (gender/lang explicit)
  let nPref = 0;
  if (criteria.gender && criteria.gender !== 'any') {
    nPref += (therapist as any).gender && (therapist as any).gender === criteria.gender ? 0.5 : 0;
  } else {
    nPref += 0.25;
  }
  if (criteria.languages && criteria.languages.length > 0) {
    const langMatch = criteria.languages.some(l => therapist.languages?.includes(l));
    nPref += langMatch ? 0.5 : 0;
  } else {
    nPref += 0.25;
  }
  nPref = Math.min(1, nPref);

  // Weights per spec: diag 30, problem areas 20, spec 10, avail 20, dist 15, rating 7, pref 3
  const score = (
    0.30 * nDiag +        // Diagnosis match (primary)
    0.20 * nProblemAreas + // Problem area matching (new)
    0.10 * nIssues +      // Specialty overlap (reduced)
    0.20 * nAvailability +// Availability timing
    0.15 * nDistance +    // Distance importance
    0.07 * nRating +      // Rating polish
    0.03 * nPref          // Explicit preferences
  );

  const breakdown = [
    { label: 'Diagnózy', value: Math.round(nDiag * 100) },
    { label: 'Problémové oblasti', value: Math.round(nProblemAreas * 100) },
    { label: 'Specializace', value: Math.round(nIssues * 100) },
    { label: 'Dostupnost', value: Math.round(nAvailability * 100) },
    { label: 'Vzdálenost', value: Math.round(nDistance * 100) },
    { label: 'Hodnocení', value: Math.round(nRating * 100) },
    { label: 'Preference', value: Math.round(nPref * 100) },
  ];

  return { score: Math.round(score * 100), breakdown };
}

// Progressive relaxation levels
export interface RelaxationLevel {
  name: string;
  description: string;
  filters: (therapist: Therapist, criteria: MatchingCriteria) => boolean;
}

export const RELAXATION_LEVELS: RelaxationLevel[] = [
  {
    name: 'strict',
    description: 'Přesné shody',
    filters: (t, c) => passesFullFilters(t, c)
  },
  {
    name: 'no-time',
    description: 'Bez časových omezení',
    filters: (t, c) => {
      if (!passesStrictFilters(t, c)) return false;
      // Skip time filter, keep distance
      if (c.coordinates && c.maxDistance) {
        const distance = calculateDistance(c.coordinates, t.location);
        t.distanceKm = distance;
        if (distance > c.maxDistance) return false;
      }
      return true;
    }
  },
  {
    name: 'no-experience',
    description: 'Bez zkušenostních omezení',
    filters: (t, c) => {
      // Skip experience filter, keep gender and language
      if (c.gender && c.gender !== 'any') {
        if (t.gender && t.gender !== c.gender) return false;
      }
      if (c.languages && c.languages.length > 0) {
        if (!t.languages || t.languages.length === 0) return false;
        const hasMatchingLanguage = c.languages.some(lang => t.languages!.includes(lang));
        if (!hasMatchingLanguage) return false;
      }
      // Keep distance
      if (c.coordinates && c.maxDistance) {
        const distance = calculateDistance(c.coordinates, t.location);
        t.distanceKm = distance;
        if (distance > c.maxDistance) return false;
      }
      return true;
    }
  },
  {
    name: 'no-language',
    description: 'Bez jazykových omezení',
    filters: (t, c) => {
      // Only gender and distance
      if (c.gender && c.gender !== 'any') {
        if (t.gender && t.gender !== c.gender) return false;
      }
      if (c.coordinates && c.maxDistance) {
        const distance = calculateDistance(c.coordinates, t.location);
        t.distanceKm = distance;
        if (distance > c.maxDistance) return false;
      }
      return true;
    }
  },
  {
    name: 'expanded-distance',
    description: 'Rozšířená vzdálenost',
    filters: (t, c) => {
      // Only gender, expand distance to 2x
      if (c.gender && c.gender !== 'any') {
        if (t.gender && t.gender !== c.gender) return false;
      }
      if (c.coordinates && c.maxDistance) {
        const distance = calculateDistance(c.coordinates, t.location);
        t.distanceKm = distance;
        if (distance > (c.maxDistance * 2)) return false;
      }
      return true;
    }
  }
];

// Main matching function with fallback
export function matchTherapists(answers: QuestionnaireAnswers): { 
  matches: TherapistMatch[], 
  fallbackUsed: boolean, 
  fallbackLevel: string 
} {
  const criteria = answersToCriteria(answers);
  
  // Log effective filter object for QA
  console.log('🎯 Effective filter criteria:', {
    issues: criteria.issues,
    diagnosisTags: criteria.diagnosisTags,
    gender: criteria.gender,
    languages: criteria.languages,
    experiences: criteria.experiences,
    maxDistance: criteria.maxDistance,
    timePreferences: criteria.timePreferences,
    coverageType: criteria.coverageType
  });

  let matches: TherapistMatch[] = [];
  let fallbackUsed = false;
  let fallbackLevel = 'strict';

  // Try each relaxation level until we have enough results
  for (const level of RELAXATION_LEVELS) {
    const candidates: TherapistMatch[] = [];
    
    for (const therapist of MOCK_THERAPISTS) {
      if (level.filters(therapist, criteria)) {
        const { score, breakdown } = computeCompositeScore(therapist, criteria);
        
        const nextAvailableSlot = therapist.nextSlots && therapist.nextSlots.length > 0 
          ? therapist.nextSlots[0].startISO 
          : undefined;

        // Generate match reasons including problem area matches
        const matchReasons: string[] = [];
        
        // Add problem area matches if any
        if (criteria.problemAreas && criteria.problemAreas.length > 0) {
          const matchingAreas = criteria.problemAreas.filter(area => 
            therapist.specializations?.includes(area)
          );
          if (matchingAreas.length > 0) {
            matchReasons.push(`Specializace: ${matchingAreas.join(', ')}`);
          }
        }
        
        // Add other high-scoring factors
        const topFactor = breakdown.find(b => b.value > 0 && b.label !== 'Problémové oblasti');
        if (topFactor) {
          matchReasons.push(topFactor.label);
        }
        
        if (matchReasons.length === 0) {
          matchReasons.push('Dostupný terapeut');
        }

        candidates.push({
          therapist,
          score,
          matchReasons,
          distanceKm: therapist.distanceKm || 0,
          nextAvailableSlot
        });
      }
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    // If we have enough results, use this level
    if (candidates.length >= 3) {
      matches = candidates.slice(0, 6); // Return top 6
      fallbackLevel = level.name;
      if (level.name !== 'strict') {
        fallbackUsed = true;
      }
      break;
    }
  }

  // Runtime assert for QA
  if (matches.length === 0) {
    console.error('❌ No matches found even with full relaxation - this should never happen');
  }

  console.log(`📊 Matching results: ${matches.length} matches, fallback: ${fallbackUsed ? fallbackLevel : 'none'}`);

  return { matches, fallbackUsed, fallbackLevel };
}

// Format next available slot for display
export function formatNextSlot(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Dnes';
  if (diffDays === 1) return 'Zítra';
  if (diffDays <= 7) return `Za ${diffDays} dní`;
  
  return date.toLocaleDateString('cs-CZ', { 
    day: 'numeric', 
    month: 'short' 
  });
}
