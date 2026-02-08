-- Migration: Create therapist_applications table
-- Run this migration to set up the therapist application system

-- Enable pgcrypto extension for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Therapist applications table
CREATE TABLE IF NOT EXISTS therapist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NULL,
  city TEXT NULL,
  is_certified BOOLEAN NOT NULL,
  is_in_training BOOLEAN NOT NULL,
  how_did_you_hear TEXT NULL,
  note TEXT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapist_applications_created_at ON therapist_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_therapist_applications_email ON therapist_applications(email);
CREATE INDEX IF NOT EXISTS idx_therapist_applications_status ON therapist_applications(status);

-- Note: We don't add a unique constraint on (email, phone) to allow multiple applications
-- from the same person (e.g., if they want to update their information)

