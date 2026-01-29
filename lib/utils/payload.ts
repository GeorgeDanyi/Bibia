import { getAnswers } from './answers';
import type { Payload, RequiredPayload, PayloadValidation } from '../types/payload';

// Convert answers to payload
export const createPayloadFromAnswers = (): Payload => {
  const answers = getAnswers();
  
  // Map Czech gender values to English
  const mapGenderPref = (gender?: string): "male" | "female" | "any" => {
    if (!gender) return "any";
    const g = gender.toLowerCase();
    if (g === 'zena' || g === 'žena' || g === 'female') return "female";
    if (g === 'muz' || g === 'muž' || g === 'male') return "male";
    return "any";
  };
  
  // Map meetingType values to Payload format
  const mapMeetingType = (type?: string): "clinic" | "home_visit" | "online" | undefined => {
    if (!type || type === 'any') return undefined;
    if (type === 'home') return "home_visit";
    if (type === 'clinic' || type === 'online') return type;
    return undefined;
  };
  
  // Map languages array to single language for Payload
  const mapLanguage = (languages?: string[]): "cestina" | "english" | "deutsch" | "slovak" => {
    if (!languages || languages.length === 0) return "cestina";
    const lang = languages[0].toLowerCase();
    if (lang.includes('english') || lang.includes('angličtina') || lang === 'en') return "english";
    if (lang.includes('deutsch') || lang.includes('němčina') || lang === 'de') return "deutsch";
    if (lang.includes('slovak') || lang.includes('slovenština') || lang === 'sk') return "slovak";
    return "cestina"; // default to Czech
  };
  
  return {
    city: answers.city,
    coords: answers.coords ?? null,
    diagnosisIds: answers.diagnosis ?? [],
    when: { 
      day: answers.day ?? "", 
      timeSlot: answers.timeSlot ?? "" 
    },
    genderPref: mapGenderPref(answers.therapistGender),
    meetingType: mapMeetingType(answers.meetingType),
    radiusKm: answers.radiusKm ?? 30,
    language: mapLanguage(answers.languages),
  };
};

// Validate payload
export const validatePayload = (payload: Payload): PayloadValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required validations
  if (!payload.city) errors.push("City is required");
  if (!payload.coords) errors.push("Coordinates are required");
  if (!payload.diagnosisIds || payload.diagnosisIds.length === 0) {
    errors.push("At least one diagnosis is required");
  }
  
  // Warning validations
  if (payload.radiusKm && payload.radiusKm > 100) {
    warnings.push("Large search radius may return distant results");
  }
  
  if (payload.meetingType === "clinic" && !payload.coords) {
    warnings.push("Clinic meetings require coordinates for distance calculation");
  }
  
  if (payload.meetingType === "online" && payload.coords) {
    warnings.push("Online meetings don't require coordinates");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Create payload with validation
export const createValidatedPayload = (): PayloadValidation & { payload: Payload } => {
  const payload = createPayloadFromAnswers();
  const validation = validatePayload(payload);
  
  return {
    ...validation,
    payload,
  };
};

// Default payload for testing
export const createDefaultPayload = (): Payload => ({
  city: "Praha",
  coords: { lat: 50.0755, lng: 14.4378 },
  diagnosisIds: ["back_pain"],
  when: { day: "monday", timeSlot: "morning" },
  genderPref: "any",
  meetingType: "clinic",
  radiusKm: 30,
  language: "cestina",
});

// Search API call with error handling
export const searchTherapists = async (payload: Payload): Promise<any> => {
  try {
    const response = await fetch("/api/searchTherapists?debug=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search API error:', error);
    throw error;
  }
};
