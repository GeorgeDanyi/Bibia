// Mock therapist data for Bibia questionnaire (relaxed typing – used only in tests/debug)
import { Therapist } from '../types/questionnaire';

export const MOCK_THERAPISTS = [
  {
    id: 't001',
    name: 'MUDr. Anna Nováková',
    gender: 'female',
    clinicName: 'FyzioCentrum Praha',
    location: { lat: 50.0755, lng: 14.4378 },
    city: 'Praha',
    postalCode: '110 00',
    latitude: 50.0755,
    longitude: 14.4378,
    practiceType: 'clinic',
    acceptingNew: true,
    specializations: ['spine', 'pregnancy', 'postpartum'],
    tags: ['těhotenství', 'bolesti zad', 'rehabilitace'],
    diagnosisTags: ['těhotenství', 'bolesti zad', 'rehabilitace'],
    acceptedInsurers: ['vzp', 'ozp', 'zp'],
    isVerified: true,
    rating: { avg: 4.8, count: 127 },
    nextSlots: [
      { startISO: '2024-01-15T09:00:00Z', endISO: '2024-01-15T10:00:00Z' },
      { startISO: '2024-01-15T14:00:00Z', endISO: '2024-01-15T15:00:00Z' }
    ],
    priceRange: { minCZK: 800, maxCZK: 1200 },
    experienceTags: ['těhotenství', 'bolesti zad', 'rehabilitace'],
    lastActiveISO: '2024-01-10T16:30:00Z'
  },
  {
    id: 't002',
    name: 'Bc. Tomáš Svoboda',
    gender: 'male',
    clinicName: 'SportFyzio',
    location: { lat: 50.0833, lng: 14.4167 },
    city: 'Praha',
    postalCode: '120 00',
    latitude: 50.0833,
    longitude: 14.4167,
    practiceType: 'private',
    acceptingNew: true,
    specializations: ['sport', 'joints', 'chronic'],
    tags: ['sportovní zranění', 'klouby', 'výkonnostní sport'],
    diagnosisTags: ['sportovní zranění', 'klouby', 'výkonnostní sport'],
    acceptedInsurers: ['vzp', 'ozp'],
    isVerified: true,
    rating: { avg: 4.6, count: 89 },
    nextSlots: [
      { startISO: '2024-01-16T08:00:00Z', endISO: '2024-01-16T09:00:00Z' },
      { startISO: '2024-01-16T17:00:00Z', endISO: '2024-01-16T18:00:00Z' }
    ],
    priceRange: { minCZK: 900, maxCZK: 1300 },
    experienceTags: ['sportovní zranění', 'klouby', 'výkonnostní sport'],
    lastActiveISO: '2024-01-11T12:15:00Z'
  },
  {
    id: 't003',
    name: 'Mgr. Petra Kratochvílová',
    gender: 'female',
    clinicName: 'Zdravé záda',
    location: { lat: 50.0900, lng: 14.4000 },
    city: 'Praha',
    postalCode: '130 00',
    latitude: 50.0900,
    longitude: 14.4000,
    practiceType: 'clinic',
    acceptingNew: true,
    specializations: ['spine', 'chronic', 'postpartum'],
    tags: ['chronické bolesti', 'rehabilitace', 'ergonomie'],
    diagnosisTags: ['chronické bolesti', 'rehabilitace', 'ergonomie'],
    acceptedInsurers: ['zp', 'vzp'],
    isVerified: true,
    rating: { avg: 4.9, count: 156 },
    nextSlots: [
      { startISO: '2024-01-15T10:30:00Z', endISO: '2024-01-15T11:30:00Z' },
      { startISO: '2024-01-17T09:00:00Z', endISO: '2024-01-17T10:00:00Z' }
    ],
    priceRange: { minCZK: 750, maxCZK: 1100 },
    experienceTags: ['chronické bolesti', 'rehabilitace', 'ergonomie'],
    lastActiveISO: '2024-01-12T14:45:00Z'
  },
  {
    id: 't004',
    name: 'MUDr. Jan Procházka',
    gender: 'male',
    clinicName: 'FyzioPraha',
    location: { lat: 50.0700, lng: 14.4500 },
    city: 'Praha',
    postalCode: '140 00',
    latitude: 50.0700,
    longitude: 14.4500,
    practiceType: 'private',
    acceptingNew: false,
    specializations: ['sport', 'joints'],
    tags: ['profesionální sport', 'úrazy', 'výkonnostní trénink'],
    diagnosisTags: ['profesionální sport', 'úrazy', 'výkonnostní trénink'],
    acceptedInsurers: [],
    isVerified: true,
    rating: { avg: 4.7, count: 203 },
    nextSlots: [
      { startISO: '2024-01-15T16:00:00Z', endISO: '2024-01-15T17:00:00Z' },
      { startISO: '2024-01-18T08:30:00Z', endISO: '2024-01-18T09:30:00Z' }
    ],
    priceRange: { minCZK: 1000, maxCZK: 1500 },
    experienceTags: ['profesionální sport', 'úrazy', 'výkonnostní trénink'],
    lastActiveISO: '2024-01-13T11:20:00Z'
  },
  {
    id: 't005',
    name: 'Bc. Lucie Dvořáková',
    gender: 'female',
    clinicName: 'Maminky v pohybu',
    location: { lat: 50.0850, lng: 14.4200 },
    city: 'Praha',
    postalCode: '150 00',
    latitude: 50.0850,
    longitude: 14.4200,
    practiceType: 'home_visits',
    acceptingNew: true,
    specializations: ['pregnancy', 'postpartum', 'spine'],
    tags: ['těhotenství', 'poporodní péče', 'diastáza'],
    diagnosisTags: ['těhotenství', 'poporodní péče', 'diastáza'],
    acceptedInsurers: ['vzp', 'ozp', 'zp'],
    isVerified: true,
    rating: { avg: 4.8, count: 94 },
    nextSlots: [
      { startISO: '2024-01-16T10:00:00Z', endISO: '2024-01-16T11:00:00Z' },
      { startISO: '2024-01-17T14:00:00Z', endISO: '2024-01-17T15:00:00Z' }
    ],
    priceRange: { minCZK: 850, maxCZK: 1250 },
    experienceTags: ['těhotenství', 'poporodní péče', 'diastáza'],
    lastActiveISO: '2024-01-14T09:30:00Z'
  },
  {
    id: 't006',
    name: 'Mgr. Pavel Novák',
    gender: 'male',
    clinicName: 'FyzioBrno',
    location: { lat: 49.1951, lng: 16.6068 },
    city: 'Brno',
    postalCode: '602 00',
    latitude: 49.1951,
    longitude: 16.6068,
    practiceType: 'clinic',
    acceptingNew: true,
    specializations: ['chronic', 'spine', 'joints'],
    tags: ['chronické stavy', 'rehabilitace', 'bolesti zad'],
    diagnosisTags: ['chronické stavy', 'rehabilitace', 'bolesti zad'],
    acceptedInsurers: ['vzp', 'ozp'],
    isVerified: true,
    rating: { avg: 4.5, count: 78 },
    nextSlots: [
      { startISO: '2024-01-15T13:00:00Z', endISO: '2024-01-15T14:00:00Z' },
      { startISO: '2024-01-19T09:00:00Z', endISO: '2024-01-19T10:00:00Z' }
    ],
    priceRange: { minCZK: 700, maxCZK: 1000 },
    experienceTags: ['chronické stavy', 'rehabilitace', 'bolesti zad'],
    lastActiveISO: '2024-01-11T16:00:00Z'
  }
];

// Specialization mapping for Czech labels
export const SPECIALIZATION_LABELS: Record<string, string> = {
  'spine': 'Bolesti zad/krku',
  'joints': 'Bolesti kloubů',
  'sport': 'Sportovní úraz',
  'pregnancy': 'Těhotenství',
  'postpartum': 'Po porodu',
  'chronic': 'Dlouhodobá diagnóza'
};

// Insurance company labels
export const INSURANCE_LABELS: Record<string, string> = {
  'vzp': 'VZP',
  'ozp': 'OZP',
  'zp': 'ZP'
};


