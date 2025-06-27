-- Add trash system to files and folders tables
-- Add columns for soft delete functionality

-- Add columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS original_folder_id UUID DEFAULT NULL; -- Store original location

-- Add columns to folders table  
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS original_parent_id UUID DEFAULT NULL; -- Store original location

-- Create indexes for better performance on trash queries
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON folders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted_by ON files(deleted_by);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_by ON folders(deleted_by);

-- Update RLS policies to exclude deleted items from normal queries
-- Drop existing policies and recreate them with trash awareness

-- Files policies
DROP POLICY IF EXISTS "Students can view accessible files" ON files;
DROP POLICY IF EXISTS "Allow file creation with folder assignment" ON files;
DROP POLICY IF EXISTS "Allow file updates with folder validation" ON files;
DROP POLICY IF EXISTS "Allow file deletion" ON files;

-- Students can view non-deleted files in their folders or files assigned to them
CREATE POLICY "Students can view accessible files" ON files
FOR SELECT USING (
  deleted_at IS NULL AND (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Allow file creation with folder assignment
CREATE POLICY "Allow file creation with folder assignment" ON files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  (student_id = auth.uid() AND (
    folder_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM folders 
      WHERE folders.id = folder_id 
      AND folders.student_id = auth.uid()
      AND folders.deleted_at IS NULL
    )
  ))
);

-- Allow file updates (including folder moves and soft delete)
CREATE POLICY "Allow file updates with folder validation" ON files
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  (student_id = auth.uid() AND (
    folder_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM folders 
      WHERE folders.id = folder_id 
      AND folders.student_id = auth.uid()
      AND folders.deleted_at IS NULL
    )
  ))
);

-- Allow file deletion (soft delete)
CREATE POLICY "Allow file deletion" ON files
FOR DELETE USING (
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Folders policies
DROP POLICY IF EXISTS "Students can view own folders" ON folders;
DROP POLICY IF EXISTS "Students can create own folders" ON folders;
DROP POLICY IF EXISTS "Students can update own folders" ON folders;
DROP POLICY IF EXISTS "Students can delete own folders" ON folders;

-- Students can view their own non-deleted folders
CREATE POLICY "Students can view own folders" ON folders
FOR SELECT USING (
  deleted_at IS NULL AND (
    auth.uid() = student_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Students can create folders in their own space
CREATE POLICY "Students can create own folders" ON folders
FOR INSERT WITH CHECK (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Students can update their own non-deleted folders
CREATE POLICY "Students can update own folders" ON folders
FOR UPDATE USING (
  deleted_at IS NULL AND (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Students can delete their own folders (soft delete)
CREATE POLICY "Students can delete own folders" ON folders
FOR DELETE USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create separate RLS policies for viewing trash (admin only)
-- Admin can view deleted files
CREATE POLICY "Admins can view deleted files" ON files
FOR SELECT USING (
  deleted_at IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Admin can view deleted folders
CREATE POLICY "Admins can view deleted folders" ON folders
FOR SELECT USING (
  deleted_at IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create function to soft delete a folder and all its contents
CREATE OR REPLACE FUNCTION soft_delete_folder_with_contents(folder_uuid UUID, deleter_id UUID)
RETURNS VOID AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Soft delete all files in this folder
  UPDATE files 
  SET 
    deleted_at = current_time,
    deleted_by = deleter_id,
    original_folder_id = folder_id
  WHERE folder_id = folder_uuid AND deleted_at IS NULL;
  
  -- Soft delete all subfolders recursively
  WITH RECURSIVE folder_tree AS (
    -- Base case: direct children
    SELECT id FROM folders WHERE parent_id = folder_uuid AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: children of children
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.deleted_at IS NULL
  )
  UPDATE folders 
  SET 
    deleted_at = current_time,
    deleted_by = deleter_id,
    original_parent_id = parent_id
  WHERE id IN (SELECT id FROM folder_tree);
  
  -- Soft delete files in all subfolders
  WITH RECURSIVE folder_tree AS (
    -- Base case: direct children
    SELECT id FROM folders WHERE parent_id = folder_uuid AND deleted_at IS NOT NULL
    
    UNION ALL
    
    -- Recursive case: children of children  
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.deleted_at IS NOT NULL
  )
  UPDATE files 
  SET 
    deleted_at = current_time,
    deleted_by = deleter_id,
    original_folder_id = folder_id
  WHERE folder_id IN (SELECT id FROM folder_tree) AND deleted_at IS NULL;
  
  -- Finally, soft delete the folder itself
  UPDATE folders 
  SET 
    deleted_at = current_time,
    deleted_by = deleter_id,
    original_parent_id = parent_id
  WHERE id = folder_uuid AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to restore a folder and all its contents
CREATE OR REPLACE FUNCTION restore_folder_with_contents(folder_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Restore the folder itself
  UPDATE folders 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    parent_id = COALESCE(original_parent_id, parent_id),
    original_parent_id = NULL
  WHERE id = folder_uuid AND deleted_at IS NOT NULL;
  
  -- Restore all files that were originally in this folder
  UPDATE files 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    folder_id = COALESCE(original_folder_id, folder_id),
    original_folder_id = NULL
  WHERE original_folder_id = folder_uuid AND deleted_at IS NOT NULL;
  
  -- Restore all subfolders recursively
  WITH RECURSIVE folder_tree AS (
    -- Base case: direct children that were originally under this folder
    SELECT id FROM folders 
    WHERE original_parent_id = folder_uuid AND deleted_at IS NOT NULL
    
    UNION ALL
    
    -- Recursive case: children of restored children
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.original_parent_id = ft.id
    WHERE f.deleted_at IS NOT NULL
  )
  UPDATE folders 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    parent_id = COALESCE(original_parent_id, parent_id),
    original_parent_id = NULL
  WHERE id IN (SELECT id FROM folder_tree);
  
  -- Restore files in all restored subfolders
  WITH RECURSIVE folder_tree AS (
    -- Include the main folder
    SELECT folder_uuid as id
    
    UNION ALL
    
    -- Include restored subfolders
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.deleted_at IS NULL
  )
  UPDATE files 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    folder_id = COALESCE(original_folder_id, folder_id),
    original_folder_id = NULL
  WHERE original_folder_id IN (SELECT id FROM folder_tree) AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to permanently delete old trash items (1 month old)
CREATE OR REPLACE FUNCTION permanent_delete_old_trash()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_paths TEXT[];
BEGIN
  -- Get file paths for storage cleanup
  SELECT array_agg(path) INTO file_paths
  FROM files 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '1 month';
  
  -- Permanently delete old files
  DELETE FROM files 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '1 month';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Permanently delete old folders
  DELETE FROM folders 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '1 month';
    
  -- TODO: Clean up storage files (file_paths array contains the paths)
  -- This would need to be done via a Supabase Edge Function or similar
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to empty trash completely
CREATE OR REPLACE FUNCTION empty_trash()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_paths TEXT[];
BEGIN
  -- Get file paths for storage cleanup
  SELECT array_agg(path) INTO file_paths
  FROM files 
  WHERE deleted_at IS NOT NULL;
  
  -- Permanently delete all files in trash
  DELETE FROM files WHERE deleted_at IS NOT NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Permanently delete all folders in trash
  DELETE FROM folders WHERE deleted_at IS NOT NULL;
  
  -- TODO: Clean up storage files (file_paths array contains the paths)
  -- This would need to be done via a Supabase Edge Function or similar
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql; 