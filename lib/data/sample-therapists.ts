// Sample therapist data for development and testing

import { Therapist } from '@/lib/types/therapist';

export const sampleTherapists: Therapist[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    fullName: "MUDr. Jana Nováková",
    city: "Praha",
    regions: ["Praha", "Středočeský"],
    languages: ["cs", "en"],
    yearsExperience: 8,
    pricePerSession: 1200,
    availability: [
      { day: "Mon", slots: ["09:00-12:00", "14:00-17:00"] },
      { day: "Tue", slots: ["09:00-12:00", "14:00-17:00"] },
      { day: "Wed", slots: ["09:00-12:00"] },
      { day: "Thu", slots: ["09:00-12:00", "14:00-17:00"] },
      { day: "Fri", slots: ["09:00-12:00"] }
    ],
    specialties: ["Bolesti zad / krku", "Sportovní úraz", "Rehabilitace po operaci"],
    diagnoses: ["Skolióza", "Po operaci menisku"],
    modalities: ["DNS", "McKenzie", "Manuální terapie"],
    worksWith: ["sportovci", "těhotné"],
    rating: { average: 4.8, count: 127 },
    reviewsCount: 127,
    bio: "Specializuji se na léčbu bolestí zad a sportovních úrazů. Mám bohaté zkušenosti s prací se sportovci a těhotnými ženami.",
    clinicName: "Fyzioterapie Nováková",
    address: "Václavské náměstí 1, Praha 1",
    phone: "+420 123 456 789",
    email: "jana.novakova@example.cz",
    insuranceAccepted: ["VZP", "ZPMV", "OZP"],
    isVerified: true
  } as Therapist,
  {
    id: "550e8400-e29b-41d4-a716-446655440002", 
    fullName: "Bc. Petr Svoboda",
    city: "Brno",
    regions: ["Jihomoravský"],
    languages: ["cs", "de"],
    yearsExperience: 5,
    pricePerSession: 1000,
    availability: [
      { day: "Mon", slots: ["08:00-12:00", "13:00-18:00"] },
      { day: "Tue", slots: ["08:00-12:00", "13:00-18:00"] },
      { day: "Wed", slots: ["08:00-12:00", "13:00-18:00"] },
      { day: "Thu", slots: ["08:00-12:00", "13:00-18:00"] },
      { day: "Fri", slots: ["08:00-12:00"] }
    ],
    specialties: ["Bolesti kloubů", "Rehabilitace po úrazu", "Dlouhodobé onemocnění / diagnóza"],
    diagnoses: ["Bechtěrev", "Osteoporóza"],
    modalities: ["Visceral", "Mulligan", "Kinesio Taping"],
    worksWith: ["senioři", "děti"],
    rating: { average: 4.6, count: 89 },
    reviewsCount: 89,
    bio: "Zaměřuji se na léčbu chronických onemocnění a rehabilitaci po úrazech. Mám zkušenosti s prací se seniory a dětmi.",
    clinicName: "Rehabilitace Svoboda",
    address: "Náměstí Svobody 15, Brno",
    phone: "+420 987 654 321",
    email: "petr.svoboda@example.cz",
    insuranceAccepted: ["VZP", "ZPMV"],
    isVerified: true
  } as Therapist,
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    fullName: "Mgr. Anna Dvořáková",
    city: "Ostrava", 
    regions: ["Moravskoslezský"],
    languages: ["cs", "sk"],
    yearsExperience: 12,
    pricePerSession: 1100,
    availability: [
      { day: "Mon", slots: ["07:00-11:00", "12:00-16:00"] },
      { day: "Tue", slots: ["07:00-11:00", "12:00-16:00"] },
      { day: "Wed", slots: ["07:00-11:00", "12:00-16:00"] },
      { day: "Thu", slots: ["07:00-11:00", "12:00-16:00"] },
      { day: "Fri", slots: ["07:00-11:00"] }
    ],
    specialties: ["Těhotenství / po porodu", "Bolesti svalů / šlach", "Bolesti hlavy / migrény"],
    diagnoses: ["Výhřez ploténky"],
    modalities: ["Bobath", "Vojta", "PNF"],
    worksWith: ["těhotné", "dospívající"],
    rating: { average: 4.9, count: 156 },
    reviewsCount: 156,
    bio: "Specializuji se na péči o těhotné ženy a léčbu bolestí hlavy. Mám dlouholeté zkušenosti s dětskou fyzioterapií.",
    clinicName: "Fyzioterapie Dvořáková",
    address: "Masarykovo náměstí 8, Ostrava",
    phone: "+420 555 123 456",
    email: "anna.dvorakova@example.cz", 
    insuranceAccepted: ["VZP", "ZPMV", "OZP", "ČPZP"],
    isVerified: true
  } as Therapist
];

