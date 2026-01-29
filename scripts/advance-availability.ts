#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Advance availability slots by removing past dates and adding new future dates
function advanceAvailabilitySlots(availability: string[], daysToAdvance: number = 7): string[] {
  const now = new Date()
  const futureDate = new Date(now.getTime() + daysToAdvance * 24 * 60 * 60 * 1000)
  
  // Filter out past dates and keep only future dates
  const futureSlots = availability.filter(slot => {
    const slotDate = new Date(slot)
    return slotDate > now
  })
  
  // Generate new slots for the next week
  const newSlots: string[] = []
  const lastSlotDate = futureSlots.length > 0 
    ? new Date(futureSlots[futureSlots.length - 1])
    : new Date(now)
  
  // Add new slots for the next 7 days after the last existing slot
  for (let day = 1; day <= 7; day++) {
    const date = new Date(lastSlotDate)
    date.setDate(lastSlotDate.getDate() + day)
    
    // Skip weekends for some patterns
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const shouldHaveSlots = Math.random() > 0.3 // 70% chance of having slots
    
    if (shouldHaveSlots) {
      // Generate 1-3 random time slots for this day
      const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      const numSlots = Math.floor(Math.random() * 3) + 1
      const selectedTimes = timeSlots
        .sort(() => Math.random() - 0.5)
        .slice(0, numSlots)
      
      for (const time of selectedTimes) {
        const [hours, minutes] = time.split(':')
        const slotDate = new Date(date)
        slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        
        // Add some randomness (±15 minutes)
        const randomMinutes = Math.floor(Math.random() * 30) - 15
        slotDate.setMinutes(slotDate.getMinutes() + randomMinutes)
        
        newSlots.push(slotDate.toISOString())
      }
    }
  }
  
  // Combine existing future slots with new slots
  const allSlots = [...futureSlots, ...newSlots]
  
  // Sort chronologically
  return allSlots.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
}

async function advanceTherapistAvailability() {
  try {
    console.log('🔄 Advancing therapist availability...')
    
    // Read current therapists data
    const therapistsPath = path.join(__dirname, '../data/therapists.json')
    const therapistsData = JSON.parse(fs.readFileSync(therapistsPath, 'utf8'))
    
    console.log(`📊 Processing ${therapistsData.length} therapists`)
    
    // Update availability for each therapist
    const updatedTherapists = therapistsData.map((therapist: any) => {
      const newAvailability = advanceAvailabilitySlots(therapist.availability || [])
      
      return {
        ...therapist,
        availability: newAvailability,
        // Update next_available field
        next_available: newAvailability.length > 0 ? newAvailability[0] : null
      }
    })
    
    // Write updated data back to file
    fs.writeFileSync(therapistsPath, JSON.stringify(updatedTherapists, null, 2))
    
    console.log('✅ Successfully advanced therapist availability!')
    
    // Show some statistics
    const totalSlots = updatedTherapists.reduce((sum: number, t: any) => sum + t.availability.length, 0)
    const avgSlotsPerTherapist = Math.round(totalSlots / updatedTherapists.length)
    
    console.log(`📈 Statistics:`)
    console.log(`   - Total availability slots: ${totalSlots}`)
    console.log(`   - Average slots per therapist: ${avgSlotsPerTherapist}`)
    
    // Show date range
    const allDates = updatedTherapists.flatMap((t: any) => t.availability).sort()
    if (allDates.length > 0) {
      const firstDate = new Date(allDates[0])
      const lastDate = new Date(allDates[allDates.length - 1])
      console.log(`   - Date range: ${firstDate.toLocaleDateString('cs-CZ')} - ${lastDate.toLocaleDateString('cs-CZ')}`)
    }
    
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
    console.error('❌ Error advancing therapist availability:', error)
    process.exit(1)
  }
}

// Run the update
advanceTherapistAvailability()

