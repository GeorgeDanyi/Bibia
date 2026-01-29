-- Migration: Create bookings table for instant booking system
-- Run this migration to set up the booking system

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Booking details
  therapist_id VARCHAR(255) NOT NULL,
  service_id VARCHAR(255) NOT NULL,
  form VARCHAR(50) NOT NULL CHECK (form IN ('online', 'in_person')),
  language VARCHAR(50) NOT NULL,
  
  -- Time slot
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Optional
  note TEXT,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  
  -- User identification (optional for MVP)
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(50)
);

-- UNIQUE constraint: prevent double booking of the same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_therapist_starts_at 
  ON bookings(therapist_id, starts_at) 
  WHERE status = 'booked';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_therapist_id ON bookings(therapist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at ON bookings(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

