/**
 * Centralized Answer Model
 * 
 * This is the canonical structure for questionnaire answers across the entire application.
 * All questionnaire components, storage, and matching logic should use this type.
 */

export type GenderPreference = 'male' | 'female' | 'any';

export interface Answers {
  city: string;
  radiusKm: number;
  meetingType: 'clinic' | 'home' | 'online' | 'any';
  problemArea: string;
  problemDetail?: string;
  ageGroup: 'child' | 'adult' | 'senior';
  genderPreference: GenderPreference;
  strictGender: boolean;
  barrierFree: boolean;
  languages: string[];
  insuranceMode: 'insurance' | 'self-pay';
  timesOfDay: string[];
  weekdays: string[];

  /**
   * Legacy questionnaire fields kept for backward compatibility with
   * `QuestionnaireCanonicalClient` during the migration to the new model.
   * These are optional and may or may not be present in persisted data.
   */

  // Step 1 – legacy visit mode (mapped into meetingType)
  visitMode?: 'clinic' | 'home_visit' | 'online' | 'any';

  // Step 2 – legacy conditions model
  conditionsMain?: string[];
  conditionsDetail?: string[];
  conditionsDetailByCategory?: Record<string, string[]>;
  activeRefinementCategory?: string;

  // Step 3 – diagnosis (new canonical fields already above: problemArea/problemDetail)
  hasDiagnosis?: boolean;
  diagnosis?: string[];
  customDiagnosis?: string;
  priority?: 'diagnosis' | 'none';

  // Step 4 – availability
  availability?: string[];
  step4?: {
    timeOfDay: string[];
    weekdays: string[];
  };
  weekdaysLegacy?: string[]; // optional alias for old shape, if needed

  // Step 5 – languages, insurance (canonical fields already exist)
  insurance?: string[];

  // Step 6 – special needs
  ageGroups?: string[];
  workplaceAccessibility?: string[];
  therapistGender?: 'muz' | 'zena' | 'nezalezi';
  consentGiven?: boolean;

  // Optional derived location info used when building search URLs
  coords?: { lat: number; lng: number };
  conditions?: string[];
  timeSlot?: string;
  day?: string;
}

/**
 * Default empty answers
 */
export const defaultAnswers: Answers = {
  city: '',
  radiusKm: 30,
  meetingType: 'any',
  problemArea: '',
  problemDetail: undefined,
  ageGroup: 'adult',
  genderPreference: 'any',
  strictGender: false,
  barrierFree: false,
  languages: [],
  insuranceMode: 'insurance',
  timesOfDay: [],
  weekdays: []
};

/**
 * Convert old QuestionnaireCanonicalAnswers to new Answers format
 */
export function migrateToAnswers(old: any): Answers {
  // Map visitMode to meetingType
  const visitMode = old.visitMode || old.meetingType || 'any';
  const meetingType = visitMode === 'clinic' || visitMode === 'ordinace' ? 'clinic' :
                     visitMode === 'home_visit' || visitMode === 'dojíždění' || visitMode === 'dojizdeni' ? 'home' :
                     visitMode === 'online' ? 'online' : 'any';

  // Map legacy therapistGender to canonical genderPreference
  // Priority: explicit non-"any" legacy therapistGender first, then existing genderPreference/gender, else "any".
  // Legacy values:
  // - "zena" / "žena"  -> "female"
  // - "muz" / "muž"    -> "male"
  // - "", undefined, "any", "nezalezi", "nezáleží" -> "any"
  const rawTherapistGender = (old.therapistGender ?? '').toString().trim().toLowerCase();
  let genderPreference: GenderPreference = 'any';

  if (rawTherapistGender === 'zena' || rawTherapistGender === 'žena') {
    genderPreference = 'female';
  } else if (rawTherapistGender === 'muz' || rawTherapistGender === 'muž') {
    genderPreference = 'male';
  } else if (rawTherapistGender === 'any' || rawTherapistGender === 'nezalezi' || rawTherapistGender === 'nezáleží' || rawTherapistGender === '') {
    // leave as 'any'
    genderPreference = 'any';
  } else if (typeof old.genderPreference === 'string') {
    const g = old.genderPreference.toLowerCase();
    if (g === 'female' || g === 'male' || g === 'any') {
      genderPreference = g as GenderPreference;
    }
  } else if (typeof old.gender === 'string') {
    const g = old.gender.toLowerCase();
    if (g === 'female' || g === 'male') {
      genderPreference = g as GenderPreference;
    }
  }

  // Map ageGroups array to single ageGroup
  const ageGroups = old.ageGroups || [];
  const ageGroup: 'child' | 'adult' | 'senior' = 
    ageGroups.includes('child') ? 'child' :
    ageGroups.includes('senior') ? 'senior' : 'adult';

  // Map conditionsMain to problemArea
  const conditionsMain = old.conditionsMain || [];
  const problemArea = conditionsMain[0] || old.problemArea || '';

  // Map conditionsDetail to problemDetail
  const conditionsDetail = old.conditionsDetail || [];
  const problemDetail = conditionsDetail[0] || old.problemDetail;

  // Map workplaceAccessibility to barrierFree
  const workplaceAccessibility = old.workplaceAccessibility || [];
  const barrierFree = workplaceAccessibility.length > 0 || Boolean(old.barrierFree);

  // Map insurance array to insuranceMode
  const insurance = old.insurance || [];
  const insuranceMode: 'insurance' | 'self-pay' = 
    insurance.length === 0 || insurance.includes('self-pay') || insurance.includes('selfpay') ? 'self-pay' : 'insurance';

  // Map step4 or availability to timesOfDay and weekdays
  const step4 = old.step4 || {};
  const timesOfDay = step4.timeOfDay || old.availability || old.timesOfDay || [];
  const weekdays = step4.weekdays || old.weekdays || [];

  // Get languages
  const languages = old.languages || [];

  // Get radiusKm
  const radiusKm = typeof old.radiusKm === 'number' ? old.radiusKm : 30;

  const result: Answers = {
    city: old.city || '',
    radiusKm,
    meetingType,
    problemArea,
    problemDetail,
    ageGroup,
    genderPreference,
    strictGender: typeof old.strictGender === 'boolean' ? old.strictGender : Boolean(old.strictGender),
    barrierFree,
    languages,
    insuranceMode,
    timesOfDay,
    weekdays
  };
  
  console.log('🔍 [MIGRATE_TO_ANSWERS] Input old format:', JSON.stringify(old, null, 2));
  console.log('🔍 [MIGRATE_TO_ANSWERS] Output new format:', JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * Convert new Answers format to old QuestionnaireCanonicalAnswers format (for backward compatibility)
 */
export function migrateFromAnswers(answers: Answers): any {
  return {
    city: answers.city,
    visitMode: answers.meetingType === 'clinic' ? 'clinic' :
               answers.meetingType === 'home' ? 'home_visit' :
               answers.meetingType === 'online' ? 'online' : 'any',
    conditionsMain: answers.problemArea ? [answers.problemArea] : [],
    conditionsDetail: answers.problemDetail ? [answers.problemDetail] : [],
    ageGroups: [answers.ageGroup],
    therapistGender: answers.genderPreference === 'male' ? 'muz' :
                     answers.genderPreference === 'female' ? 'zena' : 'nezalezi',
    strictGender: answers.strictGender,
    workplaceAccessibility: answers.barrierFree ? ['bezbariérový'] : [],
    languages: answers.languages,
    insurance: answers.insuranceMode === 'insurance' ? ['insurance'] : ['self-pay'],
    step4: {
      timeOfDay: answers.timesOfDay,
      weekdays: answers.weekdays
    },
    radiusKm: answers.radiusKm,
    availability: answers.timesOfDay,
    weekdays: answers.weekdays
  };
}

