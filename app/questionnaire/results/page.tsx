"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAnswers, setAnswers } from "@/lib/utils/answers";
import type { Answers } from "@/lib/types/answers";
import { X, Search, Grid3x3, List, CheckCircle, MapPin, HelpCircle } from "lucide-react";
import { shouldShowStrictGenderZeroResultsNotice } from "@/lib/utils/strictGenderZeroResults";
import { toArray } from "@/lib/utils/normalize";
import { Input } from "@/components/ui/input";
import { pickTopReasonsCs } from "@/lib/matching/reasonCopy";
import { Button } from "@/components/ui/button";
import { getTherapistAvailabilityStatus } from "@/lib/utils/availability-status";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";

// TherapistCard component with enhanced features
function TherapistCardEnhanced({ 
  therapist, 
  index, 
  router 
}: { 
  therapist: any; 
  index: number; 
  router: any;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipType, setTooltipType] = useState<'recommendation' | 'availability' | null>(null);

  const name = therapist.name || therapist.therapist?.fullName || "Bez jména";
  const city = therapist.city || therapist.therapist?.city || "Město neuvedeno";

  // Format name - no comma after academic titles
  const formatName = (name: string) => {
    if (!name) return 'Bez jména'
    return name.replace(/\b(MUDr|Mgr|Ing|Bc|PhDr|PhD|Dr|Prof)\.\s*,/g, '$1. ')
  }
  const displayName = formatName(name);

  // Derive initials for avatar fallback
  const initials = typeof name === "string"
    ? name
        .split(" ")
        .map((part) => part?.[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  // Get match score and badge text
  const rawMatchPercent = therapist.match_score;
  const hasMatchPercent = typeof rawMatchPercent === "number" && isFinite(rawMatchPercent);
  const matchPercent = hasMatchPercent ? Math.round(rawMatchPercent) : null;
  
  // Badge text - "Doporučeno" for high matches (>= 75%), "Možná shoda" for others
  const isRecommended = matchPercent !== null && matchPercent >= 75;
  const badgeText = isRecommended ? 'Doporučeno' : (matchPercent !== null ? 'Možná shoda' : null);
  
  // "Doporučeno Bibia" for top 1-2 cards
  const isBibiaRecommended = isRecommended && index < 2;
  
  // Get availability status from centralized system
  const availability = getTherapistAvailabilityStatus(therapist, matchPercent);
  
  // Mock trust indicator (UI only)
  const getTrustIndicator = (): string | null => {
    if (matchPercent !== null && matchPercent >= 75) {
      return 'Ověřeno klienty Bibia'
    } else if (matchPercent !== null && matchPercent >= 55 && index % 3 === 0) {
      return 'Velmi dobře hodnocený terapeut'
    }
    return null
  }
  const trustIndicator = getTrustIndicator();
  

  // Get avatar photo if available
  const photoUrl = therapist.therapist?.photo || therapist.photo;
  
  // Get distance if available
  const distanceKm = therapist.distance_km || therapist.therapist?.distance_km;
  const hasDistance = typeof distanceKm === 'number' && isFinite(distanceKm);
  const distanceStr = hasDistance ? `${distanceKm.toFixed(1).replace('.', ',')} km` : null;

  // Get reasons for pill-style labels
  const rawReasonsSource = 
    (Array.isArray(therapist.reasons) && therapist.reasons) ||
    (Array.isArray((therapist as any).matchReasons) && (therapist as any).matchReasons) ||
    (Array.isArray(therapist.therapist?.matchReasons) && therapist.therapist.matchReasons) ||
    [];
  const reasonsList = pickTopReasonsCs(rawReasonsSource, 'card', 2);

  // Handle full card click to open profile
  const handleCardClick = () => {
    const therapistId =
      therapist.id ||
      therapist.therapist?.id ||
      (therapist as any).therapist?.id ||
      (therapist as any)._id;

    if (therapistId) {
      router.push(`/therapists/${therapistId}`);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative rounded-xl shadow-sm border-0 p-4 cursor-pointer flex flex-col transition-all duration-250 ease-out ${
          isBibiaRecommended 
            ? 'bg-gradient-to-br from-seafoam-50/40 to-white border border-seafoam-200/30 hover:from-seafoam-50/60 hover:to-white hover:-translate-y-1 hover:shadow-lg' 
            : 'bg-white hover:bg-seafoam-50/30 hover:-translate-y-1 hover:shadow-lg'
        }`}
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* "Doporučeno Bibia" badge - Top right */}
        {isBibiaRecommended && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-seafoam-200/60 text-seafoam-800 border border-seafoam-300/50 backdrop-blur-sm">
              Doporučeno Bibia
            </span>
          </div>
        )}

        {/* Regular match badge - only show if not Bibia recommended */}
        {!isBibiaRecommended && badgeText && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-seafoam-100 text-seafoam-700 border border-seafoam-200/50 transition-all duration-250 group-hover:scale-105 group-hover:bg-seafoam-200/80 group-hover:border-seafoam-300/70">
              {badgeText}
            </span>
          </div>
        )}

        {/* Avatar - Smaller but still prominent */}
        <div className="flex justify-center mb-3 mt-0.5">
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-seafoam-100 to-seafoam-200 flex items-center justify-center text-seafoam-700 font-semibold text-base md:text-lg shrink-0 shadow-sm border-2 border-seafoam-100 overflow-hidden transition-all duration-250 group-hover:shadow-md group-hover:ring-2 group-hover:ring-seafoam-200/50 group-hover:ring-offset-2 group-hover:ring-offset-transparent">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.textContent = initials;
                    }
                  }}
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>

        {/* Name - Main focus, centered */}
        <div className="text-center mb-2">
          <h3 className="text-sm md:text-base font-semibold text-[#1c4a44] mb-1 line-clamp-2">
            {displayName}
          </h3>
          
          {/* Location - Secondary text, muted */}
          {city && (
            <p className="text-[11px] text-seafoam-600 font-normal">
              {city}
              {distanceStr && ` • ${distanceStr}`}
            </p>
          )}
        </div>

        {/* Trust indicator - soft, non-comparative */}
        {trustIndicator && (
          <div className="mb-2 flex justify-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-normal text-seafoam-700 bg-seafoam-50/50 border border-seafoam-200/30">
              <CheckCircle className="w-3 h-3 text-seafoam-600" />
              {trustIndicator}
            </span>
          </div>
        )}

        {/* Pill-style labels for specialties/reasons */}
        {reasonsList.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 justify-center">
            {reasonsList.slice(0, 1).map((reason, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-seafoam-50 text-seafoam-700 border border-seafoam-200/50 line-clamp-1"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Availability indicator */}
        <div className="mb-2 flex justify-center">
          <AvailabilityBadge availability={availability} size="sm" />
        </div>


        {/* Primary CTA - "Zobrazit profil" */}
        <div className="mt-1">
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              const therapistId =
                therapist.id ||
                therapist.therapist?.id ||
                (therapist as any).therapist?.id ||
                (therapist as any)._id;

              if (therapistId) {
                router.push(`/therapists/${therapistId}`);
              }
            }}
            className="w-full bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white text-[11px] font-medium h-8 shadow-sm transition-all duration-250 rounded-lg group-hover:shadow-md group-hover:from-[#257a65] group-hover:to-[#2e8b75]"
          >
            Zobrazit profil
          </Button>
        </div>
      </div>

      {/* Tooltip/Modal for secondary action */}
      {showTooltip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTooltip(false);
              setTooltipType(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 border border-seafoam-200/50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1c4a44]">
                {tooltipType === 'recommendation' ? 'Proč doporučujeme' : 'Dostupnost'}
              </h3>
              <button
                onClick={() => {
                  setShowTooltip(false);
                  setTooltipType(null);
                }}
                className="text-seafoam-600 hover:text-seafoam-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-seafoam-700 space-y-2">
              {tooltipType === 'recommendation' ? (
                <p>
                  Tento terapeut má vysokou shodu s vašimi požadavky a je ověřený našimi klienty. 
                  Specializuje se na problémy, které jste uvedli, a má dobré hodnocení.
                </p>
              ) : (
                <p>
                  Aktuální dostupnost se může měnit. Pro přesné informace o volných termínech 
                  kontaktujte terapeuta přímo nebo si zobrazte jeho profil.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setShowTooltip(false);
                  setTooltipType(null);
                }}
                className="bg-seafoam-600 hover:bg-seafoam-700 text-white"
              >
                Rozumím
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswersState] = useState<Answers | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);

  // Perform search with current answers
  const performSearch = useCallback(async (currentAnswers: Answers) => {
    console.log("🔍 [RESULTS PAGE] performSearch called, setting loading to true");
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log("🔍 [RESULTS PAGE] Performing search with answers:", JSON.stringify(currentAnswers, null, 2));

      // Create payload using new Answers structure - only include valid Answers fields
      const payload: Answers = {
        city: currentAnswers.city || '',
        radiusKm: currentAnswers.radiusKm || 30,
        meetingType: currentAnswers.meetingType || 'any',
        problemArea: currentAnswers.problemArea || '',
        problemDetail: currentAnswers.problemDetail,
        ageGroup: currentAnswers.ageGroup || 'adult',
        genderPreference: currentAnswers.genderPreference || 'any',
        strictGender: currentAnswers.strictGender !== undefined ? currentAnswers.strictGender : false,
        barrierFree: currentAnswers.barrierFree !== undefined ? currentAnswers.barrierFree : false,
        languages: Array.isArray(currentAnswers.languages) && currentAnswers.languages.length > 0 
          ? currentAnswers.languages 
          : ['cs'],
        insuranceMode: currentAnswers.insuranceMode || 'insurance',
        timesOfDay: Array.isArray(currentAnswers.timesOfDay) ? currentAnswers.timesOfDay : [],
        weekdays: Array.isArray(currentAnswers.weekdays) ? currentAnswers.weekdays : []
      };

      console.log("🔍 [RESULTS PAGE] Final payload to API:", JSON.stringify(payload, null, 2));

      // Send POST request
      const response = await fetch("/api/searchTherapists?debug=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("🔍 [RESULTS PAGE] Response status:", response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 [RESULTS PAGE] Response not OK:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log("🔍 [RESULTS PAGE] API response received:", {
        total: data.total,
        resultsCount: data.results?.length,
        fallbackUsed: data.fallbackUsed,
        hasResults: !!data.results
      });
      
      // Ensure we have the expected structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Merge match reasons from canonical matchResults (if present) into the
      // legacy results[] objects so that the UI can always show
      // "Proč právě on/ona" for matchResults-backed items.
      let merged = data;
      try {
        const mr = data.matchResults;
        const matchesArray = Array.isArray(mr?.matches)
          ? mr.matches
          : Array.isArray(mr)
            ? mr
            : [];

        const reasonsById: Record<string, string[]> = {};
        matchesArray.forEach((m: any) => {
          const t = m.therapist || {};
          const id = t.id || m.id;
          if (!id) return;

          const rawReasonsSource = Array.isArray(m.reasons) ? m.reasons : [];
          const texts: string[] = rawReasonsSource
            .map((r: any) => {
              if (typeof r === "string") return r;
              if (typeof r?.detailCs === "string") return r.detailCs;
              if (typeof r?.labelCs === "string") return r.labelCs;
              if (typeof r?.label === "string") return r.label;
              return "";
            })
            .map((text: string) => (typeof text === "string" ? text.trim() : ""))
            .filter((text: string) => text.length > 0)
            .slice(0, 3);

          if (texts.length > 0) {
            reasonsById[id] = texts;
          }
        });

        if (Array.isArray(data.results) && Object.keys(reasonsById).length > 0) {
          merged = {
            ...data,
            results: data.results.map((r: any) => {
              const existingReasons = toArray((r as any).reasons);
              if (existingReasons.length > 0) return r;
              const id = r.id || r.therapist?.id;
              const mergedReasons = id && reasonsById[id] ? reasonsById[id] : [];
              return mergedReasons.length > 0 ? { ...r, reasons: mergedReasons } : r;
            })
          };
        }
      } catch {
        // If anything goes wrong during merge, fall back to raw data.
        merged = data;
      }

      console.log("🔍 [RESULTS PAGE] Setting results state");
      setResults(merged);
      
      // Persist results to sessionStorage so detail pages can access match data
      try {
        if (typeof window !== 'undefined' && merged?.results && Array.isArray(merged.results)) {
          window.sessionStorage?.setItem('bibiaLastResults', JSON.stringify(merged.results))
        }
      } catch (err) {
        console.warn('Failed to save results to sessionStorage:', err)
      }
      
      console.log("🔍 [RESULTS PAGE] Results state set successfully");
    } catch (err) {
      console.error("🔍 [RESULTS PAGE] Search failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setResults(null);
    } finally {
      console.log("🔍 [RESULTS PAGE] Finally block - setting loading to false");
      setLoading(false);
      console.log("🔍 [RESULTS PAGE] Loading set to false");
    }
  }, []);

  // Load answers and perform initial search
  useEffect(() => {
    const loadedAnswers = getAnswers();
    console.log("🔍 [RESULTS PAGE] Loaded answers from localStorage:", loadedAnswers);
    setAnswersState(loadedAnswers);
    performSearch(loadedAnswers);
  }, [performSearch]);

  // Update answers and trigger search
  const updateAnswers = useCallback((updates: Partial<Answers>) => {
    if (!answers) return;
    
    const updatedAnswers: Answers = { ...answers, ...updates };
    setAnswersState(updatedAnswers);
    setAnswers(updatedAnswers);
    performSearch(updatedAnswers);
  }, [answers, performSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-seafoam-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seafoam-600 mx-auto mb-4"></div>
            <p className="text-seafoam-600 text-lg">Načítám výsledky...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-seafoam-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-red-600">Chyba při vyhledávání</h1>
              </div>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to render filter chips
  const renderFilterChips = () => {
    if (!answers) return null;

    const chips: JSX.Element[] = [];

    // Gender preference chips
    if (answers.genderPreference && answers.genderPreference !== 'any') {
      const genderLabel = answers.genderPreference === 'male' ? 'Muž' : 
                         answers.genderPreference === 'female' ? 'Žena' : 'Nezáleží';
      chips.push(
        <div
          key="gender-preference"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-seafoam-200/60 bg-seafoam-50/60 text-seafoam-600 text-xs font-medium"
        >
          <span>{genderLabel}</span>
          <button
            onClick={() => updateAnswers({ genderPreference: 'any' })}
            className="ml-0.5 hover:bg-seafoam-100 rounded-full p-0.5 transition-colors"
            aria-label={`Odstranit ${genderLabel}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    // Strict gender chip
    if (answers.strictGender && answers.genderPreference !== 'any') {
      chips.push(
        <div
          key="strict-gender"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-200/60 bg-purple-50/60 text-purple-600 text-xs font-medium"
        >
          <span>Přísné pohlaví</span>
          <button
            onClick={() => updateAnswers({ strictGender: false })}
            className="ml-0.5 hover:bg-purple-100 rounded-full p-0.5 transition-colors"
            aria-label="Povolit jiné pohlaví"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    // Allow other gender chip (when strictGender is false but genderPreference is set)
    if (!answers.strictGender && answers.genderPreference && answers.genderPreference !== 'any') {
      chips.push(
        <div
          key="allow-other-gender"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-200/60 bg-purple-50/60 text-purple-600 text-xs font-medium"
        >
          <span>Povolit jiné pohlaví</span>
          <button
            onClick={() => updateAnswers({ strictGender: true })}
            className="ml-0.5 hover:bg-purple-100 rounded-full p-0.5 transition-colors"
            aria-label="Přísné pohlaví"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    // Meeting type chips
    if (answers.meetingType && answers.meetingType !== 'any') {
      const meetingTypeLabels: Record<string, string> = {
        'clinic': 'Ordinace',
        'home': 'Výjezd / Návštěva doma',
        'online': 'Online'
      };
      const label = meetingTypeLabels[answers.meetingType] || answers.meetingType;
      chips.push(
        <div
          key="meeting-type"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200/60 bg-blue-50/60 text-blue-600 text-xs font-medium"
        >
          <span>{label}</span>
          <button
            onClick={() => updateAnswers({ meetingType: 'any' })}
            className="ml-0.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
            aria-label={`Odstranit ${label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    // Barrier-free chip
    if (answers.barrierFree) {
      chips.push(
        <div
          key="barrier-free"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200/60 bg-emerald-50/60 text-emerald-600 text-xs font-medium"
        >
          <span>Bezbariérový přístup</span>
          <button
            onClick={() => updateAnswers({ barrierFree: false })}
            className="ml-0.5 hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
            aria-label="Odstranit bezbariérový přístup"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    // Languages chips
    if (answers.languages && answers.languages.length > 0) {
      const languageLabels: Record<string, string> = {
        'cs': 'Čeština',
        'en': 'Angličtina',
        'de': 'Němčina',
        'sk': 'Slovenština',
        'pl': 'Polština'
      };
      answers.languages.forEach((lang, index) => {
        const label = languageLabels[lang] || lang;
        chips.push(
          <div
            key={`language-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-200/60 bg-teal-50/60 text-teal-600 text-xs font-medium"
          >
            <span>{label}</span>
            <button
              onClick={() => {
                const newLanguages = answers.languages.filter((l, i) => i !== index);
                updateAnswers({ languages: newLanguages.length > 0 ? newLanguages : ['cs'] });
              }}
              className="ml-0.5 hover:bg-teal-100 rounded-full p-0.5 transition-colors"
              aria-label={`Odstranit ${label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      });
    }

    // Time preference chips (from timesOfDay and weekdays)
    if (answers.timesOfDay && answers.timesOfDay.length > 0) {
      answers.timesOfDay.forEach((time, index) => {
        const timeLabels: Record<string, string> = {
          'morning': 'Ráno',
          'afternoon': 'Odpoledne',
          'evening': 'Večer',
          'weekend': 'Víkend'
        };
        const label = timeLabels[time] || time;
        chips.push(
          <div
            key={`time-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-200/60 bg-orange-50/60 text-orange-600 text-xs font-medium"
          >
            <span>{label}</span>
            <button
              onClick={() => {
                const newTimesOfDay = answers.timesOfDay.filter((t, i) => i !== index);
                updateAnswers({ timesOfDay: newTimesOfDay });
              }}
              className="ml-0.5 hover:bg-orange-100 rounded-full p-0.5 transition-colors"
              aria-label={`Odstranit ${label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      });
    }

    // Conditions/Problem area chip
    if (answers.problemArea) {
      chips.push(
        <div
          key="problem-area"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200/60 bg-emerald-50/60 text-emerald-600 text-xs font-medium"
        >
          <span>{answers.problemArea}</span>
          <button
            onClick={() => updateAnswers({ problemArea: '' })}
            className="ml-0.5 hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
            aria-label="Odstranit problém"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return chips.length > 0 ? (
      <div className="flex flex-wrap gap-2.5">
        {chips}
      </div>
    ) : null;
  };

  const showStrictGenderZeroResultsNotice =
    shouldShowStrictGenderZeroResultsNotice(results as any, answers);

  const totalCount =
    (results as any)?.total ?? ((results as any)?.results?.length ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-2 pb-4 px-4 md:pt-3 md:pb-6 md:px-6 lg:pt-4 lg:pb-8 lg:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm pt-4 pb-4 px-4 md:pt-4 md:pb-6 md:px-6 lg:pt-6 lg:pb-8 lg:px-8">
        {/* Minimal header - recommendations focus */}
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-0.5">
            Terapeuti
          </h1>
          <p className="text-xs text-gray-500">
            Nalezeno {totalCount}
            {(results as any)?.fallbackUsed && (
              <span className="ml-2 text-amber-500">
                (rozšířené vyhledávání)
              </span>
            )}
          </p>
        </div>

        {/* Results section */}
        <div className="pt-2 pb-4 px-4 md:pt-2 md:pb-6 md:px-6">

          {showStrictGenderZeroResultsNotice && (
            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Nenašli jsme žádné terapeuty, kteří odpovídají zvolenému pohlaví při přísném filtrování.
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Můžete rozšířit vyhledávání a zobrazit i opačné pohlaví – ostatní vybraná kritéria zůstanou zachována.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => updateAnswers({ strictGender: false })}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    Zobrazit i opačné pohlaví
                  </button>
                </div>
              </div>
            </div>
          )}

          {!results && !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500">Žádné výsledky k zobrazení.</p>
            </div>
          )}

          {(results as any)?.results && (results as any).results.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {(results as any).results.slice(0, visibleCount).map((therapist: any, index: number) => (
                  <TherapistCardEnhanced
                    key={therapist.id || index}
                    therapist={therapist}
                    index={index}
                    router={router}
                  />
                ))}
              </div>
              
              {/* Show more button */}
              {(results as any).results.length > visibleCount && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() => setVisibleCount(prev => prev + 8)}
                    className="px-6 py-3 bg-gradient-to-r from-[#2e8b75] to-[#3da188] hover:from-[#3da188] hover:to-[#4db59a] text-white text-sm font-medium shadow-sm transition-all duration-200 rounded-lg"
                  >
                    Zobrazit další ({Math.min(8, (results as any).results.length - visibleCount)})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {/* End Results section */}
      </div>
    </div>
  );
}

