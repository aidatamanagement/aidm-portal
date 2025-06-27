-- Create folders table first
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure folder names are unique within the same parent for each student
  UNIQUE(name, parent_id, student_id)
);

-- Add folder support to files table
-- Add folder_id column to files table (nullable for root level files)
ALTER TABLE files ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_folders_student_id ON folders(student_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_student_folder ON files(student_id, folder_id);

-- Add RLS policies for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Students can view their own folders
CREATE POLICY "Students can view own folders" ON folders
FOR SELECT USING (
  auth.uid() = student_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
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

-- Students can update their own folders
CREATE POLICY "Students can update own folders" ON folders
FOR UPDATE USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Students can delete their own folders
CREATE POLICY "Students can delete own folders" ON folders
FOR DELETE USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update files table RLS to consider folder ownership
-- Drop existing policies and recreate them with folder support
DROP POLICY IF EXISTS "Students can view own files" ON files;
DROP POLICY IF EXISTS "Admins can manage all files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to download files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON files;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON files;

-- Students can view files in their folders or files assigned to them
CREATE POLICY "Students can view accessible files" ON files
FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
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
    )
  ))
);

-- Allow file updates (including folder moves)
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
    )
  ))
);

-- Allow file deletion
CREATE POLICY "Allow file deletion" ON files
FOR DELETE USING (
  student_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a function to get folder path
CREATE OR REPLACE FUNCTION get_folder_path(folder_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  path TEXT := '';
  current_folder folders%ROWTYPE;
  parent_folder folders%ROWTYPE;
BEGIN
  -- Get the current folder
  SELECT * INTO current_folder FROM folders WHERE id = folder_uuid;
  
  IF NOT FOUND THEN
    RETURN '';
  END IF;
  
  path := current_folder.name;
  
  -- Traverse up the hierarchy
  WHILE current_folder.parent_id IS NOT NULL LOOP
    SELECT * INTO parent_folder FROM folders WHERE id = current_folder.parent_id;
    
    IF NOT FOUND THEN
      EXIT;
    END IF;
    
    path := parent_folder.name || '/' || path;
    current_folder := parent_folder;
  END LOOP;
  
  RETURN path;
END;
$$ LANGUAGE plpgsql; 