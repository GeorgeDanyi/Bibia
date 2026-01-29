// Enhanced type definitions for search payload
export type Payload = {
  city?: string;
  coords?: { lat: number; lng: number } | null;
  diagnosisIds?: string[];
  when?: { day: string; timeSlot: string };
  genderPref?: "male" | "female" | "any";
  meetingType?: "clinic" | "home_visit" | "online";
  radiusKm?: number;
  language?: "cestina" | "english" | "deutsch" | "slovak";
};

// More specific types for better validation
export type RequiredPayload = {
  city: string;
  coords: { lat: number; lng: number };
  diagnosisIds: string[];
  when: { day: string; timeSlot: string };
  genderPref: "male" | "female" | "any";
  meetingType: "clinic" | "home_visit" | "online";
  radiusKm: number;
  language: "cestina" | "english" | "deutsch" | "slovak";
};

// Validation type
export type PayloadValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

// Search result types
export type SearchResult = {
  results?: any[];
  meta?: any;
  error?: string;
  total?: number;
  fallbackUsed?: boolean;
  fallbackLevel?: string;
};

// Answers type for localStorage
export type Answers = Record<string, any>;
