export interface Therapist {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  practiceType: "private" | "clinic" | "hospital" | "home_visits" | "online";
  diagnosisTags: string[];
  languages: string[];
  acceptingNew: boolean;
  nextAvailableDays?: number|null;
  pricePerHour?: number|null;
  isFixture?: boolean;
  gender?: 'male' | 'female';
  rating?: {
    average: number;
    count: number;
  };
  profileImage?: string;
  priceRange?: { minCZK: number; maxCZK: number };
  pricePerSession?: number;
  availability?: string[];
  clinicLat?: number;
  clinicLon?: number;
  homeVisitRadiusKm?: number;
}

// TEMP: in-memory source (replace with DB later)
import fs from "node:fs";
import path from "node:path";
import { normalizeTherapistGender } from "@/lib/utils/normalize";

const publicJsonPath = path.join(process.cwd(), "public", "data", "therapists.json");

function readPublicJson(): Therapist[] {
  try {
    if (fs.existsSync(publicJsonPath)) {
      const raw = fs.readFileSync(publicJsonPath, "utf-8");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        // Normalize gender for all therapists
        return arr.map((therapist: any) => {
          if (therapist.gender !== undefined) {
            therapist.gender = normalizeTherapistGender(therapist.gender, therapist.id);
          }
          return therapist;
        });
      }
    }
  } catch {}
  return []; // no file or invalid → fall back to fixtures
}

const fixtures: Therapist[] = [
  // keep it small but valid; CZ coords
  { id:"pra-a", name:"Mgr. C Dvořáková", city:"Praha", latitude:50.100, longitude:14.300, practiceType:"clinic", diagnosisTags:["backneck"], languages:["cs","en"], acceptingNew:true, nextAvailableDays:5, isFixture:true },
  { id:"ost-b", name:"Bc. B Veselý", city:"Ostrava", latitude:49.780, longitude:18.330, practiceType:"online", diagnosisTags:["backneck"], languages:["cs","en"], acceptingNew:true, nextAvailableDays:1, isFixture:true },
  { id:"brn-a", name:"Mgr. E Svoboda", city:"Brno", latitude:49.260, longitude:16.550, practiceType:"clinic", diagnosisTags:["backneck"], languages:["cs"], acceptingNew:true, nextAvailableDays:7, isFixture:true },
];

export async function getTherapists(): Promise<Therapist[]> {
  // Server-only loader — NEVER fetch from client
  const fromPublic = readPublicJson();
  return fromPublic.length ? fromPublic : fixtures;
}