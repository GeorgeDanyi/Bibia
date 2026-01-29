// Seamless availability service abstraction
// Ensures transition to real calendars requires no UI/API change

import { Therapist } from '@/lib/types/therapist';
import { AvailabilityResult, AvailabilityPreferences } from '@/lib/utils/availability-api';
import { getAvailabilityDisplay, UserPreferences } from '@/lib/utils/availability-display';

// Service configuration
interface AvailabilityServiceConfig {
  useRealCalendars: boolean;
  fallbackToMock: boolean;
  cacheTimeout: number; // milliseconds
}

class AvailabilityService {
  private config: AvailabilityServiceConfig;
  private cache: Map<string, { data: AvailabilityResult; timestamp: number }> = new Map();

  constructor(config: AvailabilityServiceConfig) {
    this.config = config;
  }

  /**
   * Get availability for a therapist
   * This is the main API that never changes - UI always calls this
   */
  async getAvailability(
    therapistId: string,
    preferences: AvailabilityPreferences
  ): Promise<AvailabilityResult> {
    const cacheKey = `${therapistId}-${JSON.stringify(preferences)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
    }

    let result: AvailabilityResult;

    if (this.config.useRealCalendars) {
      try {
        result = await this.getRealCalendarAvailability(therapistId, preferences);
      } catch (error) {
        console.warn('Real calendar failed, falling back to mock:', error);
        if (this.config.fallbackToMock) {
          result = await this.getMockAvailability(therapistId, preferences);
        } else {
          throw error;
        }
      }
    } else {
      result = await this.getMockAvailability(therapistId, preferences);
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Get availability for multiple therapists
   * UI can call this without knowing about real vs mock
   */
  async getMultipleAvailability(
    therapistIds: string[],
    preferences: AvailabilityPreferences
  ): Promise<Record<string, AvailabilityResult>> {
    const results: Record<string, AvailabilityResult> = {};
    
    // Process in parallel for better performance
    const promises = therapistIds.map(async (id) => {
      const result = await this.getAvailability(id, preferences);
      return { id, result };
    });

    const resolved = await Promise.all(promises);
    
    resolved.forEach(({ id, result }) => {
      results[id] = result;
    });

    return results;
  }

  /**
   * Filter therapists by availability
   * UI can use this without knowing the implementation
   */
  async filterByAvailability(
    therapists: Therapist[],
    preferences: AvailabilityPreferences
  ): Promise<Therapist[]> {
    const results = await this.getMultipleAvailability(
      therapists.map(t => t.id),
      preferences
    );

    return therapists.filter(therapist => {
      const result = results[therapist.id];
      return result && result.hasSlots;
    });
  }

  /**
   * Sort therapists by availability score
   * UI can use this without knowing the implementation
   */
  async sortByAvailability(
    therapists: Therapist[],
    preferences: AvailabilityPreferences
  ): Promise<Therapist[]> {
    const results = await this.getMultipleAvailability(
      therapists.map(t => t.id),
      preferences
    );

    return therapists
      .map(therapist => ({
        therapist,
        result: results[therapist.id]
      }))
      .filter(item => item.result) // Only include therapists with results
      .sort((a, b) => (b.result?.availabilityScore || 0) - (a.result?.availabilityScore || 0))
      .map(item => item.therapist);
  }

  /**
   * Get availability statistics
   * UI can use this for analytics without knowing implementation
   */
  async getAvailabilityStats(
    therapists: Therapist[],
    preferences: AvailabilityPreferences
  ): Promise<{
    total: number;
    available: number;
    notAccepting: number;
    waiting: number;
    avgScore: number;
    timePreferenceMatches: number;
  }> {
    const results = await this.getMultipleAvailability(
      therapists.map(t => t.id),
      preferences
    );

    const available = Object.values(results).filter(r => r.status === 'available').length;
    const notAccepting = Object.values(results).filter(r => r.status === 'not-accepting').length;
    const waiting = Object.values(results).filter(r => r.status === 'waiting').length;
    
    const avgScore = Object.values(results).length > 0 
      ? Object.values(results).reduce((sum, r) => sum + r.availabilityScore, 0) / Object.values(results).length 
      : 0;
    
    // Count therapists that match time preferences
    const timePreferenceMatches = therapists.filter(therapist => {
      const { workingHours } = therapist;
      return preferences.timePreferences.some(pref => {
        switch (pref) {
          case 'morning': return workingHours.morning;
          case 'afternoon': return workingHours.midday;
          case 'evening': return workingHours.evening;
          case 'weekend': return workingHours.weekend;
          default: return false;
        }
      });
    }).length;
    
    return {
      total: therapists.length,
      available,
      notAccepting,
      waiting,
      avgScore: Math.round(avgScore),
      timePreferenceMatches
    };
  }

  /**
   * Real calendar implementation (future)
   * This is where real calendar integration goes
   */
  private async getRealCalendarAvailability(
    therapistId: string,
    preferences: AvailabilityPreferences
  ): Promise<AvailabilityResult> {
    // TODO: Implement real calendar integration
    // This would connect to Google Calendar, Outlook, etc.
    // The UI never needs to know about this implementation
    
    console.log(`Getting real calendar availability for therapist ${therapistId}`);
    
    // For now, throw error to trigger fallback
    throw new Error('Real calendar integration not implemented yet');
  }

  /**
   * Mock implementation (current)
   * This provides believable data for development
   */
  private async getMockAvailability(
    therapistId: string,
    preferences: AvailabilityPreferences
  ): Promise<AvailabilityResult> {
    // Get therapist data (this would come from database in real implementation)
    const therapist = await this.getTherapistData(therapistId);
    
    if (!therapist) {
      return {
        hasSlots: false,
        availabilityScore: 0,
        status: 'not-accepting',
        message: 'Terapeut nenalezen'
      };
    }

    // Use existing display logic
    const userPrefs: UserPreferences = {
      timePreferences: preferences.timePreferences,
      urgency: preferences.urgency
    };
    
    const display = getAvailabilityDisplay(therapist, userPrefs);
    
    // Calculate next slot ISO string
    let nextSlotIso: string | undefined;
    if (therapist.nextAvailableDays !== null) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + therapist.nextAvailableDays);
      nextSlotIso = nextDate.toISOString();
    }
    
    return {
      hasSlots: display.status !== 'not-accepting',
      nextSlotIso,
      availabilityScore: display.availabilityScore,
      status: display.status,
      message: display.message,
      nextAvailableDays: therapist.nextAvailableDays || undefined
    };
  }

  /**
   * Get therapist data
   * This abstracts the data source (database, API, etc.)
   */
  private async getTherapistData(therapistId: string): Promise<Therapist | null> {
    // TODO: Replace with real database/API call
    // This would query the therapist database
    
    // For now, return mock data
    return {
      id: therapistId,
      fullName: 'Mock Therapist',
      city: 'Praha',
      latitude: 50.0755,
      longitude: 14.4378,
      regions: ['Praha'],
      languages: ['cs'],
      practiceType: 'private',
      acceptingNew: true,
      yearsExperience: 5,
      pricePerSession: 1200,
      nextAvailableDays: 3,
      workingHours: {
        morning: true,
        midday: true,
        evening: false,
        weekend: false
      },
      availability: [],
      specialties: ['Sportovní fyzioterapie'],
      diagnoses: [],
      tags: [],
      diagnosisTags: [],
      modalities: [],
      worksWith: [],
      rating: { average: 4.5, count: 10 },
      reviewsCount: 10,
      bio: 'Mock therapist for testing'
    };
  }

  /**
   * Clear cache
   * Useful for testing or when data changes
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   * Allows switching between mock and real calendars
   */
  updateConfig(newConfig: Partial<AvailabilityServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance with default configuration
export const availabilityService = new AvailabilityService({
  useRealCalendars: false, // Start with mock data
  fallbackToMock: true,    // Fallback to mock if real calendars fail
  cacheTimeout: 5 * 60 * 1000 // 5 minutes cache
});

// Export the class for testing
export { AvailabilityService };
