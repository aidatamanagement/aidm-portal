
-- Create the student-files storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-files', 'student-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to SELECT/download files
CREATE POLICY "Allow authenticated users to download files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'student-files' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow file uploads (for admins/uploaders)
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'student-files' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow file updates
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'student-files' AND 
  auth.role() = 'authenticated'
);

-- Create policy to allow file deletion (typically for admins)
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'student-files' AND 
  auth.role() = 'authenticated'
);
