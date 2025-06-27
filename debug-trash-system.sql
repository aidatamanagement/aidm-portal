-- Debug script for trash system
-- Run this in your Supabase SQL editor to check and fix trash system

-- Check if the trash columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'files' 
AND column_name IN ('deleted_at', 'deleted_by', 'original_folder_id');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'folders' 
AND column_name IN ('deleted_at', 'deleted_by', 'original_parent_id');

-- If columns don't exist, add them manually:
-- ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
-- ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
-- ALTER TABLE files ADD COLUMN IF NOT EXISTS original_folder_id UUID DEFAULT NULL;

-- ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
-- ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
-- ALTER TABLE folders ADD COLUMN IF NOT EXISTS original_parent_id UUID DEFAULT NULL;

-- Check if the RPC function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'soft_delete_folder_with_contents';

-- Check current RLS policies on folders table
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'folders';

-- Test admin permission
SELECT 
  auth.uid() as current_user_id,
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) as is_admin;

-- Test folder access for current user
SELECT id, name, deleted_at, student_id 
FROM folders 
WHERE student_id = 'YOUR_TEST_STUDENT_ID'  -- Replace with actual student ID
ORDER BY created_at DESC 
LIMIT 5; 