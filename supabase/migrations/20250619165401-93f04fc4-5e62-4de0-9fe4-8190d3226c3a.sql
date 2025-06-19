
-- First, let's see what policies already exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_services';

-- Check if RLS is enabled on user_services
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_services';

-- Create admin check function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Enable RLS on user_services table if not already enabled
ALTER TABLE public.user_services ENABLE ROW LEVEL SECURITY;

-- Add admin policy for viewing all user services (this is likely what's missing)
CREATE POLICY "Admins can view all user services" 
ON public.user_services 
FOR SELECT 
USING (public.is_admin_user());

-- Add admin policy for managing user services
CREATE POLICY "Admins can manage user services" 
ON public.user_services 
FOR ALL 
USING (public.is_admin_user());

-- Also check and add similar policies for user_course_assignments table
ALTER TABLE public.user_course_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own course assignments
CREATE POLICY "Users can view their own course assignments" 
ON public.user_course_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for admins to see all course assignments
CREATE POLICY "Admins can view all course assignments" 
ON public.user_course_assignments 
FOR SELECT 
USING (public.is_admin_user());

-- Policy for admins to manage course assignments
CREATE POLICY "Admins can manage course assignments" 
ON public.user_course_assignments 
FOR ALL 
USING (public.is_admin_user());
