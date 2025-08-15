-- Migration to change 'student' role to 'client' in profiles table
-- This updates all existing users with role 'student' to have role 'client'

-- First, drop the existing role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update existing records from 'student' to 'client'
UPDATE profiles 
SET role = 'client' 
WHERE role = 'student';

-- Recreate the role check constraint to allow 'admin' and 'client' roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'client'));

-- Update the default value for new profiles
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'client';

-- Update any RLS policies that reference 'student' to use 'client' instead
-- Note: This is a placeholder for any future policy updates if needed
