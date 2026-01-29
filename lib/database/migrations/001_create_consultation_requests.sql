-- Migration: Create consultation_requests table
-- Run this migration to set up the consultation request system

CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User identification (flexible - can be email/phone if no auth)
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(50),
  
  -- Request details
  therapist_id VARCHAR(255) NOT NULL,
  service_id VARCHAR(255) NOT NULL,
  form VARCHAR(50) NOT NULL CHECK (form IN ('online', 'in_person')),
  preferred_languages TEXT[] DEFAULT '{}',
  note TEXT,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'done', 'cancelled')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consultation_requests_therapist_id ON consultation_requests(therapist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON consultation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_email ON consultation_requests(user_email) WHERE user_email IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultation_requests_updated_at 
  BEFORE UPDATE ON consultation_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

