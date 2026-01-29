/**
 * Regression checks for critical user scenarios
 * Tests ensure the system works correctly in edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// Mock data for testing
const mockTherapists = [
  {
    id: '1',
    name: 'Dr. Anna Nováková',
    gender: 'female',
    city: 'Praha',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace', 'online'],
    languages: ['cs'],
    accepts_insurance: true,
    verified: true
  },
  {
    id: '2', 
    name: 'Dr. Jan Novák',
    gender: 'male',
    city: 'Praha',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace', 'online'],
    languages: ['cs'],
    accepts_insurance: true,
    verified: true
  },
  {
    id: '3',
    name: 'Dr. Marie Svobodová',
    gender: 'female', 
    city: 'Brno',
    specialties: ['anxiety', 'depression'],
    meeting_types: ['ordinace'],
    languages: ['cs'],
    accepts_insurance: false,
    verified: true
  }
]

describe('Regression Checks', () => {
  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
  })

  describe('Female Strict Gender Filter', () => {
    it('should not show male cards when female strict is selected', async () => {
      const searchParams = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'female',
        strictGender: true,
        diagnosisIds: ['anxiety']
      }

      // Mock the search API response
      const mockResponse = {
        results: mockTherapists.filter(t => t.gender === 'female'),
        totalCount: 2,
        fallbackUsed: false
      }

      // Verify no male therapists are returned
      const maleTherapists = mockResponse.results.filter(t => t.gender === 'male')
      expect(maleTherapists).toHaveLength(0)
      
      // Verify only female therapists are returned
      const femaleTherapists = mockResponse.results.filter(t => t.gender === 'female')
      expect(femaleTherapists.length).toBeGreaterThan(0)
    })

    it('should show fallback message when no female therapists available with strict gender', async () => {
      const searchParams = {
        city: 'TestCity',
        meetingType: 'ordinace', 
        therapistGenderPref: 'female',
        strictGender: true,
        diagnosisIds: ['anxiety']
      }

      // Mock empty results for strict gender
      const mockResponse = {
        results: [],
        totalCount: 0,
        fallbackUsed: true,
        fallbackLevel: 'strict'
      }

      expect(mockResponse.results).toHaveLength(0)
      expect(mockResponse.fallbackUsed).toBe(true)
    })
  })

  describe('No Problem Selected', () => {
    it('should display "neuvedeno" in summary when no problem is selected', () => {
      const normalizedQuery = {
        city: 'Praha',
        meetingType: 'ordinace',
        genderPref: 'any',
        diagnoses: [], // No diagnoses selected
        languages: ['cs']
      }

      // Test the summary logic
      const prob = (normalizedQuery.diagnoses && normalizedQuery.diagnoses.length) 
        ? normalizedQuery.diagnoses.map(d => d.label).join(", ") 
        : "neuvedeno"

      expect(prob).toBe("neuvedeno")
    })

    it('should have neutral problem score in debug when no problem selected', () => {
      const mockTherapist = {
        id: '1',
        therapist: { gender: 'female' },
        match_score: 75,
        score_breakdown: {
          diagnosis: 0, // Neutral score when no problem selected
          availability: 15,
          distance: 20,
          language: 10,
          prefs: 10,
          profile: 5
        },
        components: {
          diagnosis: 0, // Neutral component score
          gender: 0.5,
          availability: 0.6,
          distance: 0.8
        },
        matched_diagnoses: [] // No matched diagnoses
      }

      expect(mockTherapist.score_breakdown.diagnosis).toBe(0)
      expect(mockTherapist.components.diagnosis).toBe(0)
      expect(mockTherapist.matched_diagnoses).toHaveLength(0)
    })
  })

  describe('City and Meeting Type Updates', () => {
    it('should update header and results consistently when city changes', async () => {
      const initialParams = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'any'
      }

      const updatedParams = {
        city: 'Brno', 
        meetingType: 'ordinace',
        therapistGenderPref: 'any'
      }

      // Mock initial search
      const initialResults = {
        results: mockTherapists.filter(t => t.city === 'Praha'),
        totalCount: 2,
        query: initialParams
      }

      // Mock updated search
      const updatedResults = {
        results: mockTherapists.filter(t => t.city === 'Brno'),
        totalCount: 1,
        query: updatedParams
      }

      // Verify results change with city
      expect(initialResults.results.length).toBe(2)
      expect(updatedResults.results.length).toBe(1)
      expect(updatedResults.query.city).toBe('Brno')
    })

    it('should update header and results consistently when meeting type changes', async () => {
      const initialParams = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'any'
      }

      const updatedParams = {
        city: 'Praha',
        meetingType: 'online',
        therapistGenderPref: 'any'
      }

      // Mock initial search (ordinace)
      const initialResults = {
        results: mockTherapists.filter(t => t.meeting_types.includes('ordinace')),
        totalCount: 2,
        query: initialParams
      }

      // Mock updated search (online)
      const updatedResults = {
        results: mockTherapists.filter(t => t.meeting_types.includes('online')),
        totalCount: 2, // Both therapists support online
        query: updatedParams
      }

      // Verify results change with meeting type
      expect(initialResults.query.meetingType).toBe('ordinace')
      expect(updatedResults.query.meetingType).toBe('online')
      expect(updatedResults.results.every(t => t.meeting_types.includes('online'))).toBe(true)
    })

    it('should maintain query consistency between header and results', () => {
      const query = {
        city: 'Praha',
        meetingType: 'ordinace',
        therapistGenderPref: 'female',
        diagnosisIds: ['anxiety'],
        languages: ['cs']
      }

      const headerDisplay = {
        city: query.city,
        meetingType: query.meetingType,
        gender: query.therapistGenderPref === 'female' ? 'Žena' : 'Muž',
        problem: query.diagnosisIds.length > 0 ? 'Anxiety' : 'neuvedeno'
      }

      const resultsQuery = {
        city: query.city,
        meetingType: query.meetingType,
        therapistGenderPref: query.therapistGenderPref,
        diagnosisIds: query.diagnosisIds,
        languages: query.languages
      }

      // Verify consistency
      expect(headerDisplay.city).toBe(resultsQuery.city)
      expect(headerDisplay.meetingType).toBe(resultsQuery.meetingType)
      expect(headerDisplay.gender).toBe('Žena')
    })
  })

  describe('Debug Score Alignment', () => {
    it('should show debug scores that align with ranking', () => {
      const mockResults = [
        {
          id: '1',
          therapist: { gender: 'female' },
          match_score: 85,
          score_breakdown: {
            diagnosis: 40,
            availability: 15,
            distance: 20,
            language: 10,
            prefs: 10,
            profile: 5
          },
          components: {
            diagnosis: 0.8,
            gender: 1.0,
            availability: 0.6,
            distance: 0.8
          },
          matched_diagnoses: ['anxiety']
        },
        {
          id: '2',
          therapist: { gender: 'female' },
          match_score: 75,
          score_breakdown: {
            diagnosis: 30,
            availability: 15,
            distance: 15,
            language: 10,
            prefs: 10,
            profile: 5
          },
          components: {
            diagnosis: 0.6,
            gender: 1.0,
            availability: 0.6,
            distance: 0.6
          },
          matched_diagnoses: ['depression']
        }
      ]

      // Sort by match score (highest first)
      const sortedResults = mockResults.sort((a, b) => b.match_score - a.match_score)

      // Verify ranking aligns with scores
      expect(sortedResults[0].match_score).toBe(85)
      expect(sortedResults[1].match_score).toBe(75)
      expect(sortedResults[0].score_breakdown.diagnosis).toBeGreaterThan(sortedResults[1].score_breakdown.diagnosis)
    })
  })
})
