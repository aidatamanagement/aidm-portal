-- IMMEDIATE FIX: Run this in Supabase SQL Editor to fix admin folder deletion
-- This fixes the RLS policy that's blocking admin operations

-- Fix folders update policy (this is the main issue)
DROP POLICY IF EXISTS "Students can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can update accessible folders" ON folders;

CREATE POLICY "Users can update accessible folders" ON folders
FOR UPDATE USING (
  -- Students can update their own non-deleted folders
  (auth.uid() = student_id AND deleted_at IS NULL) OR
  -- Admins can update ANY folder (including for soft delete operations)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Also fix files update policy to prevent similar issues
DROP POLICY IF EXISTS "Allow file updates with folder validation" ON files;
DROP POLICY IF EXISTS "Users can update accessible files" ON files;

CREATE POLICY "Users can update accessible files" ON files
FOR UPDATE USING (
  -- Students can update their own non-deleted files
  (student_id = auth.uid() AND deleted_at IS NULL) OR
  -- Admins can update ANY file (including for soft delete operations)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Test the fix by checking if your admin user can now update folders
-- Replace 'YOUR_ADMIN_USER_ID' with your actual admin user ID
-- SELECT auth.uid() as current_user_id;
-- UPDATE folders SET updated_at = NOW() WHERE id = 'test_folder_id' LIMIT 1; 