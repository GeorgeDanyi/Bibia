/**
 * Test script to verify stable sorting across multiple runs
 */

import { rankTherapists } from '@/lib/utils/therapist-matching'
import { UserAnswers } from '@/lib/types/therapist-extended'
import fs from 'fs'
import path from 'path'

async function testStableSorting() {
  console.log("🔄 Testing Stable Sorting")
  console.log("=".repeat(40))
  
  // Load test dataset
  const dataPath = path.join(process.cwd(), 'data', 'fake-therapists-complete.json')
  const data = fs.readFileSync(dataPath, 'utf8')
  const therapists = JSON.parse(data)
  
  const testAnswers: UserAnswers = {
    city: "Praha",
    visitMode: "clinic",
    conditionsMain: ["back-pain"],
    conditionsDetail: [],
    modalities: [],
    availability: ["morning"],
    languages: ["cs"],
    insurance: [],
    ageGroups: ["adult"],
    workplaceAccessibility: [],
    consentGiven: true
  }
  
  // Run the same query multiple times
  const results: any[][] = []
  for (let i = 0; i < 5; i++) {
    const result = rankTherapists(testAnswers, therapists)
    results.push(result.slice(0, 10).map(r => ({ id: r.therapist.id, score: r.score, distance: r.distanceKm })))
  }
  
  // Check if all runs produce identical results
  const firstRun = results[0]
  let isStable = true
  
  for (let i = 1; i < results.length; i++) {
    const currentRun = results[i]
    
    for (let j = 0; j < Math.min(firstRun.length, currentRun.length); j++) {
      if (firstRun[j].id !== currentRun[j].id || 
          firstRun[j].score !== currentRun[j].score ||
          Math.abs(firstRun[j].distance - currentRun[j].distance) > 0.001) {
        console.log(`❌ Run ${i + 1} differs from run 1 at position ${j}`)
        console.log(`   Run 1: ${firstRun[j].id} (score: ${firstRun[j].score}, distance: ${firstRun[j].distance.toFixed(3)})`)
        console.log(`   Run ${i + 1}: ${currentRun[j].id} (score: ${currentRun[j].score}, distance: ${currentRun[j].distance.toFixed(3)})`)
        isStable = false
      }
    }
  }
  
  if (isStable) {
    console.log("✅ Sorting is stable across multiple runs")
  } else {
    console.log("❌ Sorting is not stable")
  }
  
  // Show top 5 results for verification
  console.log("\nTop 5 results:")
  firstRun.slice(0, 5).forEach((result, index) => {
    console.log(`${index + 1}. ${result.id} - Score: ${result.score}, Distance: ${result.distance.toFixed(3)} km`)
  })
}

// Run the test
testStableSorting().catch(console.error)
