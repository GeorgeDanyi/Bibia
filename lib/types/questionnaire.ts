// TypeScript interfaces for Bibia questionnaire and therapist matching

import { CanonicalConditionCode, CanonicalDetailCode } from '../constants/canonical-taxonomy';

export type GeoPoint = { 
  lat: number; 
  lng: number; 
};

// Canonical condition and detail types
export type CanonicalCondition = {
  code: CanonicalConditionCode;
  selectedAt: string; // ISO timestamp when selected
};

export type CanonicalDetail = {
  code: CanonicalDetailCode;
  selectedAt: string; // ISO timestamp when selected
};

export type Therapist = {
  id: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  clinicName?: string;
  location: GeoPoint;
  city: string; // e.g., "Praha"
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number; // computed client-side
  modes?: Array<'in_person'|'online'>; // optional care modes
  languages?: string[]; // optional languages
  specializations: string[]; // e.g., ['sport','spine','pregnancy','postpartum','chronic']
  acceptedInsurers: string[]; // insurer codes; empty => private only
  isVerified: boolean;
  rating?: { avg: number; count: number };
  nextSlots: Array<{ startISO: string; endISO: string }>;
  priceRange?: { minCZK: number; maxCZK: number };
  experienceTags?: string[]; // free tags
  lastActiveISO?: string; // for freshness
};

export type QuestionnaireAnswers = {
  // Step 1 - User basics
  firstName?: string;
  lastName?: string;
  
  // Step 2 - Contact
  email?: string;
  phone?: string;
  
  // Step 3 - Location
  location?: {
    type: 'address' | 'geolocation' | 'anywhere';
    address?: string;
    coordinates?: GeoPoint;
  };
  distancePreference?: '3km' | '5km' | '10km' | '20km' | 'any';
  
  // Step 4 - Time preference
  timePreferences?: string[];
  wantsSoonest?: boolean;
  
  // Step 5 - Issue/focus - NEW CANONICAL STRUCTURE
  conditionsMain: CanonicalCondition[]; // Primary conditions with canonical codes
  conditionsDetail: CanonicalDetail[];  // Detail tags with canonical codes
  
  // Legacy fields (deprecated - use conditionsMain/conditionsDetail instead)
  issueTags?: string[];
  otherIssue?: string;
  
  // Step 3 - Diagnosis
  diagnosis?: string;
  onlyExactDiagnosis?: boolean; // if true, require exact diagnosis match

  // Care mode preference
  sessionMode?: 'in_person' | 'online';
  
  // Step 6 - Coverage/constraints
  coverageType?: 'insurance' | 'private' | 'either';
  constraints?: string[];
  
  // Step 7 - Start timing
  startTiming?: 'immediate' | 'this-week' | 'two-weeks' | 'flexible';
};

export type MatchingCriteria = {
  location?: GeoPoint;
  maxDistance?: number;
  specializations?: string[];
  timePreferences?: string[];
  coverageType?: 'insurance' | 'private' | 'either';
  constraints?: string[];
  wantsSoonest?: boolean;
  startTiming?: string;
  // Additional hard/soft filters
  sessionMode?: 'in_person' | 'online' | 'any';
  onlyExactDiagnosis?: boolean;
  // Problem area matching
  problemAreas?: string[]; // From conditionsMain and conditionsDetail
};

export type TherapistMatch = {
  therapist: Therapist;
  score: number;
  matchReasons: string[];
  distanceKm: number;
  nextAvailableSlot?: string;
};

