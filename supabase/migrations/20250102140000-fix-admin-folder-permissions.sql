-- Fix RLS policies for admin folder operations
-- The issue is that admins can't update folders owned by students

-- Drop and recreate the folders update policy to allow admins
DROP POLICY IF EXISTS "Students can update own folders" ON folders;

CREATE POLICY "Users can update accessible folders" ON folders
FOR UPDATE USING (
  -- Owner can update their own folders (not deleted)
  (auth.uid() = student_id AND deleted_at IS NULL) OR
  -- Admins can update any folder (including soft deletes)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Also fix the delete policy for completeness
DROP POLICY IF EXISTS "Students can delete own folders" ON folders;

CREATE POLICY "Users can delete accessible folders" ON folders
FOR DELETE USING (
  -- Owner can delete their own folders
  auth.uid() = student_id OR
  -- Admins can delete any folder
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix the files update policy as well (same issue might occur)
DROP POLICY IF EXISTS "Allow file updates with folder validation" ON files;

CREATE POLICY "Users can update accessible files" ON files
FOR UPDATE USING (
  -- Owner can update their own files (not deleted)
  (student_id = auth.uid() AND deleted_at IS NULL) OR
  -- Admins can update any file (including soft deletes)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix the files delete policy
DROP POLICY IF EXISTS "Allow file deletion" ON files;

CREATE POLICY "Users can delete accessible files" ON files
FOR DELETE USING (
  -- Owner can delete their own files
  student_id = auth.uid() OR
  -- Admins can delete any file
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
); 