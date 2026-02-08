-- Migration: Update user roles from 'user' to 'patient' and add role constraints
-- Run this migration to update the role system

-- Step 1: Update existing 'user' roles to 'patient'
UPDATE users SET role = 'patient' WHERE role = 'user';

-- Step 2: Change default value from 'user' to 'patient'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient';

-- Step 3: Add CHECK constraint to enforce allowed role values
-- First, drop existing constraint if it exists (PostgreSQL doesn't support IF EXISTS for constraints)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check' 
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('patient', 'therapist', 'admin'));

-- Verify: Check that all existing users have valid roles
-- SELECT role, COUNT(*) FROM users GROUP BY role;

