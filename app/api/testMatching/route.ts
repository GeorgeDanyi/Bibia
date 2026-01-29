/**
 * API endpoint for testing visit mode matching logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { rankTherapists } from '@/lib/utils/therapist-matching'
import { UserAnswers } from '@/lib/types/therapist-extended'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userAnswers: UserAnswers = body.answers
    
    // Load test dataset
    const dataPath = path.join(process.cwd(), 'data', 'fake-therapists-complete.json')
    const data = fs.readFileSync(dataPath, 'utf8')
    const therapists = JSON.parse(data)
    
    // Rank therapists
    const results = rankTherapists(userAnswers, therapists)
    
    // Return top 10 results
    const topResults = results.slice(0, 10).map(result => ({
      id: result.therapist.id,
      fullName: result.therapist.fullName,
      city: result.therapist.city,
      score: result.score,
      distanceKm: result.distanceKm,
      matchReasons: result.matchReasons,
      visitModes: {
        clinic: result.therapist.offersClinic,
        homeVisit: result.therapist.offersHomeVisit,
        online: result.therapist.offersOnline
      },
      acceptingNew: result.therapist.acceptingNew,
      isVerified: result.therapist.isVerified
    }))
    
    return NextResponse.json({
      success: true,
      totalResults: results.length,
      topResults,
      userAnswers: {
        city: userAnswers.city,
        visitMode: userAnswers.visitMode
      }
    })
    
  } catch (error) {
    console.error('Matching API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Visit Mode Matching Test API',
    usage: 'POST with { answers: UserAnswers } to test matching logic'
  })
}
