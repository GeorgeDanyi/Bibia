#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate realistic availability slots for therapists over the next 4 weeks
function generateAvailabilitySlots(): string[] {
  const slots: string[] = []
  const now = new Date()
  
  // Generate slots for the next 4 weeks (28 days)
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(now)
      date.setDate(now.getDate() + (week * 7) + day)
      
      // Skip weekends for some therapists, but include them for others
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      // Different availability patterns for different therapists
      const patterns = [
        // Pattern 1: Weekdays only, morning and afternoon
        { weekdays: true, weekends: false, times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'] },
        // Pattern 2: Weekdays + Saturday, morning only
        { weekdays: true, weekends: true, times: ['08:00', '09:00', '10:00'] },
        // Pattern 3: All days, evening slots
        { weekdays: true, weekends: true, times: ['17:00', '18:00', '19:00'] },
        // Pattern 4: Weekdays only, full day
        { weekdays: true, weekends: false, times: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'] },
        // Pattern 5: Limited availability (2-3 days per week)
        { weekdays: true, weekends: false, times: ['09:00', '15:00'] }
      ]
      
      // Randomly assign pattern to each therapist
      const pattern = patterns[Math.floor(Math.random() * patterns.length)]
      
      // Check if this day should have availability
      const shouldHaveSlots = isWeekend ? pattern.weekends : pattern.weekdays
      
      if (shouldHaveSlots) {
        // Randomly select 1-3 time slots for this day
        const numSlots = Math.floor(Math.random() * 3) + 1
        const selectedTimes = pattern.times
          .sort(() => Math.random() - 0.5)
          .slice(0, numSlots)
        
        for (const time of selectedTimes) {
          const [hours, minutes] = time.split(':')
          const slotDate = new Date(date)
          slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          // Add some randomness to make it more realistic
          const randomMinutes = Math.floor(Math.random() * 30)
          slotDate.setMinutes(slotDate.getMinutes() + randomMinutes)
          
          slots.push(slotDate.toISOString())
        }
      }
    }
  }
  
  // Sort slots chronologically
  return slots.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
}

// Generate different availability patterns for different therapist types
function generateTherapistAvailability(therapistId: string, therapistType: string): string[] {
  const slots: string[] = []
  const now = new Date()
  
  // Different patterns based on therapist type or ID
  const therapistPatterns: Record<string, any> = {
    // Busy therapist - many slots
    'busy': {
      weekdays: true,
      weekends: true,
      times: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      probability: 0.8
    },
    // Part-time therapist - limited slots
    'parttime': {
      weekdays: true,
      weekends: false,
      times: ['09:00', '15:00'],
      probability: 0.4
    },
    // Weekend therapist - mainly weekends
    'weekend': {
      weekdays: false,
      weekends: true,
      times: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      probability: 0.6
    },
    // Evening therapist - late slots
    'evening': {
      weekdays: true,
      weekends: false,
      times: ['17:00', '18:00', '19:00'],
      probability: 0.7
    },
    // Standard therapist - normal business hours
    'standard': {
      weekdays: true,
      weekends: false,
      times: ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'],
      probability: 0.6
    }
  }
  
  // Determine pattern based on therapist ID or random assignment
  let pattern
  if (therapistId.includes('busy') || therapistId.includes('0001') || therapistId.includes('0002')) {
    pattern = therapistPatterns.busy
  } else if (therapistId.includes('part') || therapistId.includes('0003') || therapistId.includes('0004')) {
    pattern = therapistPatterns.parttime
  } else if (therapistId.includes('weekend') || therapistId.includes('0005') || therapistId.includes('0006')) {
    pattern = therapistPatterns.weekend
  } else if (therapistId.includes('evening') || therapistId.includes('0007') || therapistId.includes('0008')) {
    pattern = therapistPatterns.evening
  } else {
    pattern = therapistPatterns.standard
  }
  
  // Generate slots for the next 4 weeks
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(now)
      date.setDate(now.getDate() + (week * 7) + day)
      
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const shouldHaveSlots = isWeekend ? pattern.weekends : pattern.weekdays
      
      if (shouldHaveSlots && Math.random() < pattern.probability) {
        // Select 1-3 random time slots
        const numSlots = Math.floor(Math.random() * 3) + 1
        const selectedTimes = pattern.times
          .sort(() => Math.random() - 0.5)
          .slice(0, numSlots)
        
        for (const time of selectedTimes) {
          const [hours, minutes] = time.split(':')
          const slotDate = new Date(date)
          slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          // Add some randomness (±15 minutes)
          const randomMinutes = Math.floor(Math.random() * 30) - 15
          slotDate.setMinutes(slotDate.getMinutes() + randomMinutes)
          
          slots.push(slotDate.toISOString())
        }
      }
    }
  }
  
  return slots.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
}

async function updateTherapistAvailability() {
  try {
    console.log('🔄 Updating therapist availability...')
    
    // Read current therapists data
    const therapistsPath = path.join(__dirname, '../data/therapists.json')
    const therapistsData = JSON.parse(fs.readFileSync(therapistsPath, 'utf8'))
    
    console.log(`📊 Found ${therapistsData.length} therapists`)
    
    // Update availability for each therapist
    const updatedTherapists = therapistsData.map((therapist: any, index: number) => {
      const therapistId = therapist.id || `therapist_${index + 1}`
      const newAvailability = generateTherapistAvailability(therapistId, therapist.specialties?.[0] || 'standard')
      
      return {
        ...therapist,
        availability: newAvailability,
        // Add next_available field for easier access
        next_available: newAvailability.length > 0 ? newAvailability[0] : null
      }
    })
    
    // Write updated data back to file
    fs.writeFileSync(therapistsPath, JSON.stringify(updatedTherapists, null, 2))
    
    console.log('✅ Successfully updated therapist availability!')
    console.log(`📅 Generated availability slots for ${updatedTherapists.length} therapists`)
    
    // Show some statistics
    const totalSlots = updatedTherapists.reduce((sum: number, t: any) => sum + t.availability.length, 0)
    const avgSlotsPerTherapist = Math.round(totalSlots / updatedTherapists.length)
    
    console.log(`📈 Statistics:`)
    console.log(`   - Total availability slots: ${totalSlots}`)
    console.log(`   - Average slots per therapist: ${avgSlotsPerTherapist}`)
    console.log(`   - Date range: ${new Date().toLocaleDateString('cs-CZ')} - ${new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString('cs-CZ')}`)
    
    // Show sample availability for first few therapists
    console.log('\n📋 Sample availability:')
    updatedTherapists.slice(0, 3).forEach((therapist: any, index: number) => {
      console.log(`   ${therapist.id}: ${therapist.availability.length} slots`)
      if (therapist.availability.length > 0) {
        const firstSlot = new Date(therapist.availability[0])
        const lastSlot = new Date(therapist.availability[therapist.availability.length - 1])
        console.log(`     First: ${firstSlot.toLocaleString('cs-CZ')}`)
        console.log(`     Last: ${lastSlot.toLocaleString('cs-CZ')}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating therapist availability:', error)
    process.exit(1)
  }
}

// Run the update
updateTherapistAvailability()
