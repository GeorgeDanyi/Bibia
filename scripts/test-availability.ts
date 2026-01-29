#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test availability data
function testAvailabilityData() {
  try {
    console.log('🧪 Testing therapist availability data...')
    
    // Read therapists data
    const therapistsPath = path.join(__dirname, '../data/therapists.json')
    const therapistsData = JSON.parse(fs.readFileSync(therapistsPath, 'utf8'))
    
    console.log(`📊 Testing ${therapistsData.length} therapists`)
    
    const now = new Date()
    const stats = {
      totalTherapists: therapistsData.length,
      therapistsWithAvailability: 0,
      totalSlots: 0,
      futureSlots: 0,
      pastSlots: 0,
      nextWeekSlots: 0,
      weekendSlots: 0,
      weekdaySlots: 0,
      morningSlots: 0,
      afternoonSlots: 0,
      eveningSlots: 0
    }
    
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    therapistsData.forEach((therapist: any) => {
      if (therapist.availability && therapist.availability.length > 0) {
        stats.therapistsWithAvailability++
        stats.totalSlots += therapist.availability.length
        
        therapist.availability.forEach((slot: string) => {
          const slotDate = new Date(slot)
          
          if (slotDate > now) {
            stats.futureSlots++
            
            if (slotDate < nextWeek) {
              stats.nextWeekSlots++
            }
            
            // Check if weekend
            const dayOfWeek = slotDate.getDay()
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              stats.weekendSlots++
            } else {
              stats.weekdaySlots++
            }
            
            // Check time of day
            const hour = slotDate.getHours()
            if (hour < 12) {
              stats.morningSlots++
            } else if (hour < 17) {
              stats.afternoonSlots++
            } else {
              stats.eveningSlots++
            }
          } else {
            stats.pastSlots++
          }
        })
      }
    })
    
    // Display results
    console.log('\n📈 Availability Statistics:')
    console.log(`   - Therapists with availability: ${stats.therapistsWithAvailability}/${stats.totalTherapists}`)
    console.log(`   - Total slots: ${stats.totalSlots}`)
    console.log(`   - Future slots: ${stats.futureSlots}`)
    console.log(`   - Past slots: ${stats.pastSlots}`)
    console.log(`   - Next week slots: ${stats.nextWeekSlots}`)
    
    console.log('\n⏰ Time Distribution:')
    console.log(`   - Morning (6-12): ${stats.morningSlots}`)
    console.log(`   - Afternoon (12-17): ${stats.afternoonSlots}`)
    console.log(`   - Evening (17-22): ${stats.eveningSlots}`)
    
    console.log('\n📅 Day Distribution:')
    console.log(`   - Weekdays: ${stats.weekdaySlots}`)
    console.log(`   - Weekends: ${stats.weekendSlots}`)
    
    // Test specific scenarios
    console.log('\n🧪 Testing Scenarios:')
    
    // Scenario 1: Find therapists available in next 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const availableIn3Days = therapistsData.filter((therapist: any) => {
      return therapist.availability && therapist.availability.some((slot: string) => {
        const slotDate = new Date(slot)
        return slotDate > now && slotDate < threeDaysFromNow
      })
    })
    console.log(`   - Available in next 3 days: ${availableIn3Days.length} therapists`)
    
    // Scenario 2: Find weekend therapists
    const weekendTherapists = therapistsData.filter((therapist: any) => {
      return therapist.availability && therapist.availability.some((slot: string) => {
        const slotDate = new Date(slot)
        const dayOfWeek = slotDate.getDay()
        return slotDate > now && (dayOfWeek === 0 || dayOfWeek === 6)
      })
    })
    console.log(`   - Weekend available: ${weekendTherapists.length} therapists`)
    
    // Scenario 3: Find evening therapists
    const eveningTherapists = therapistsData.filter((therapist: any) => {
      return therapist.availability && therapist.availability.some((slot: string) => {
        const slotDate = new Date(slot)
        const hour = slotDate.getHours()
        return slotDate > now && hour >= 17
      })
    })
    console.log(`   - Evening available: ${eveningTherapists.length} therapists`)
    
    // Show sample availability
    console.log('\n📋 Sample Availability:')
    const sampleTherapists = therapistsData.slice(0, 3)
    sampleTherapists.forEach((therapist: any, index: number) => {
      console.log(`\n   ${therapist.id}:`)
      if (therapist.availability && therapist.availability.length > 0) {
        const nextSlots = therapist.availability
          .filter((slot: string) => new Date(slot) > now)
          .slice(0, 5)
        
        nextSlots.forEach((slot: string) => {
          const slotDate = new Date(slot)
          console.log(`     - ${slotDate.toLocaleString('cs-CZ')}`)
        })
        
        if (therapist.availability.length > 5) {
          console.log(`     ... and ${therapist.availability.length - 5} more slots`)
        }
      } else {
        console.log('     No availability')
      }
    })
    
    // Validation checks
    console.log('\n✅ Validation Checks:')
    
    if (stats.pastSlots > 0) {
      console.log(`   ⚠️  Warning: ${stats.pastSlots} past slots found`)
    } else {
      console.log('   ✅ No past slots found')
    }
    
    if (stats.futureSlots < 1000) {
      console.log(`   ⚠️  Warning: Only ${stats.futureSlots} future slots found`)
    } else {
      console.log(`   ✅ Sufficient future slots: ${stats.futureSlots}`)
    }
    
    if (stats.therapistsWithAvailability < stats.totalTherapists * 0.9) {
      console.log(`   ⚠️  Warning: Only ${stats.therapistsWithAvailability}/${stats.totalTherapists} therapists have availability`)
    } else {
      console.log(`   ✅ Most therapists have availability: ${stats.therapistsWithAvailability}/${stats.totalTherapists}`)
    }
    
    console.log('\n🎉 Availability test completed!')
    
  } catch (error) {
    console.error('❌ Error testing availability:', error)
    process.exit(1)
  }
}

// Run the test
testAvailabilityData()

