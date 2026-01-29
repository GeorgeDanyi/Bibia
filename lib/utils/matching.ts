import { Therapist, QuestionnaireAnswers, MatchingCriteria, TherapistMatch, GeoPoint } from '../types/questionnaire';
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
export function answersToCriteria(answers: QuestionnaireAnswers): MatchingCriteria {
  const criteria: MatchingCriteria = {};

  // Location and distance
  if (answers.location?.coordinates) {
    criteria.location = answers.location.coordinates;
    
    // Convert distance preference to max distance
    const distanceMap: Record<string, number> = {
      '3km': 3,
      '5km': 5,
      '10km': 10,
      '20km': 20,
      'any': 50 // Large radius for "any"
    };
    criteria.maxDistance = distanceMap[answers.distancePreference || 'any'] || 50;
  }

  // Specializations from issue tags
  if (answers.issueTags && answers.issueTags.length > 0) {
    criteria.specializations = answers.issueTags;
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

  // Time preferences
  if (answers.timePreferences && answers.timePreferences.length > 0) {
    criteria.timePreferences = answers.timePreferences;
  }

  // Coverage type
  if (answers.coverageType) {
    criteria.coverageType = answers.coverageType;
  }

  // Care mode preference
  criteria.sessionMode = (answers as any).sessionMode ?? 'any'

  // Diagnosis exact toggle
  if (answers.onlyExactDiagnosis) criteria.onlyExactDiagnosis = true

  // Constraints
  if (answers.constraints && answers.constraints.length > 0) {
    criteria.constraints = answers.constraints;
  }

  // Timing urgency
  criteria.wantsSoonest = answers.wantsSoonest || false;
  criteria.startTiming = answers.startTiming;

  return criteria;
}

// Score a therapist against matching criteria
export function scoreTherapist(therapist: Therapist, criteria: MatchingCriteria): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base score for verified therapists
  if (therapist.isVerified) {
    score += 20;
    reasons.push('Ověřený terapeut');
  }

  // HARD FILTERS — must pass to be considered
  // 1) Session mode
  if (criteria.sessionMode && criteria.sessionMode !== 'any') {
    const modes = therapist.modes || []
    if (!modes.includes(criteria.sessionMode)) {
      return { score: 0, reasons: ['Nesplňuje zvolený režim péče'] }
    }
  }

  // 2) Location + radius
  if (criteria.location && criteria.maxDistance) {
    // Source of truth: support multi-location therapists via optional clinics array (lat/lng)
    const clinicPoints: Array<{lat:number; lng:number}> = (therapist as any).clinics || []
    const distances: number[] = []
    const baseDistance = calculateDistance(criteria.location, therapist.location)
    distances.push(baseDistance)
    for (const pt of clinicPoints) {
      distances.push(calculateDistance(criteria.location, pt))
    }
    const distance = Math.min(...distances)
    therapist.distanceKm = distance;

    // Inclusion tolerance: +0.5 km to avoid edge frustration
    const passesRadius = distance <= (criteria.maxDistance + 0.5)
    if (passesRadius) {
      // SOFT score contribution
      const distanceScore = Math.max(0, 30 - (distance * 2));
      score += distanceScore;
      reasons.push(`${distance.toFixed(1)} km od tebe`);
    } else {
      return { score: 0, reasons: ['Příliš daleko'] }; // Exclude if too far
    }
  }

  // 3) Diagnosis exact (if requested) — assume therapist.experienceTags contains diagnosis tags
  if (criteria.onlyExactDiagnosis && (criteria as any).diagnosis) {
    const diag = ((criteria as any).diagnosis as string).toLowerCase()
    const tags = (therapist.experienceTags || []).map(t => t.toLowerCase())
    if (!tags.includes(diag)) {
      return { score: 0, reasons: ['Chybí přesná zkušenost s diagnózou'] }
    }
  }

  // SOFT FILTERS — contribute to ranking
  // Problem area matching (higher priority than general specializations)
  if (criteria.problemAreas && criteria.problemAreas.length > 0) {
    const matchingAreas = therapist.specializations.filter(spec => 
      criteria.problemAreas!.includes(spec)
    );
    if (matchingAreas.length > 0) {
      score += matchingAreas.length * 25; // 25 points per matching problem area
      reasons.push(`Problémové oblasti: ${matchingAreas.join(', ')}`);
    }
  } else {
    // Neutral score when no problem areas selected
    score += 10;
  }

  // Specialization matching (reduced priority when problem areas are present)
  if (criteria.specializations && criteria.specializations.length > 0) {
    const matchingSpecs = therapist.specializations.filter(spec => 
      criteria.specializations!.includes(spec)
    );
    if (matchingSpecs.length > 0) {
      score += matchingSpecs.length * 10; // Reduced from 15 to 10 points
      reasons.push(`Specializace: ${matchingSpecs.join(', ')}`);
    }
  }

  // Coverage type matching
  if (criteria.coverageType) {
    if (criteria.coverageType === 'insurance') {
      if (therapist.acceptedInsurers.length > 0) {
        score += 25;
        reasons.push('Přijímá pojišťovnu');
      }
    } else if (criteria.coverageType === 'private') {
      score += 20; // Private therapists get base score
      reasons.push('Soukromá péče');
    } else if (criteria.coverageType === 'either') {
      score += 15; // Either option gets moderate score
      reasons.push('Flexibilní platba');
    }
  }

  // Rating bonus
  if (therapist.rating && therapist.rating.avg >= 4.5) {
    score += 10;
    reasons.push(`Hodnocení ${therapist.rating.avg}/5`);
  }

  // Availability bonus (soft)
  if (therapist.nextSlots.length > 0) {
    score += 10;
    reasons.push('Dostupný termín');
  }

  // Constraint matching
  if (criteria.constraints) {
    if (criteria.constraints.includes('Krátké čekací lhůty') && therapist.nextSlots.length > 1) {
      score += 15;
      reasons.push('Rychlé termíny');
    }
    
    if (criteria.constraints.includes('Zkušenost s mojí diagnózou')) {
      // This would need more detailed matching in a real system
      score += 10;
      reasons.push('Zkušenost s diagnózou');
    }
  }

  // Gender preference (if specified in constraints)
  if (criteria.constraints?.includes('Terapeut stejného pohlaví')) {
    // This would need to be matched against user's gender preference
    // For now, we'll give a small bonus to all therapists
    score += 5;
  }

  return { score, reasons };
}

// Main matching function
export function findMatchingTherapists(answers: QuestionnaireAnswers): TherapistMatch[] {
  const criteria = answersToCriteria(answers);
  const matches: TherapistMatch[] = [];

  for (const therapist of MOCK_THERAPISTS as Therapist[]) {
    const { score, reasons } = scoreTherapist(therapist, criteria);
    
    if (score > 0) {
      const nextAvailableSlot = therapist.nextSlots.length > 0 
        ? therapist.nextSlots[0].startISO 
        : undefined;

      matches.push({
        therapist,
        score,
        matchReasons: reasons,
        distanceKm: therapist.distanceKm || 0,
        nextAvailableSlot
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

// Get top matches for live shortlist
export function getTopMatches(answers: QuestionnaireAnswers, limit: number = 3): TherapistMatch[] {
  const allMatches = findMatchingTherapists(answers);
  return allMatches.slice(0, limit);
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


