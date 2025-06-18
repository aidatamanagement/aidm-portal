
-- Fix foreign key relationships for user_services table
ALTER TABLE user_services 
ADD CONSTRAINT fk_user_services_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_services 
ADD CONSTRAINT fk_user_services_service_id 
FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

-- Fix foreign key relationships for user_course_assignments table
ALTER TABLE user_course_assignments 
ADD CONSTRAINT fk_user_course_assignments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_course_assignments 
ADD CONSTRAINT fk_user_course_assignments_course_id 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Fix foreign key relationships for user_lesson_locks table
ALTER TABLE user_lesson_locks 
ADD CONSTRAINT fk_user_lesson_locks_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_lesson_locks 
ADD CONSTRAINT fk_user_lesson_locks_lesson_id 
FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE user_lesson_locks 
ADD CONSTRAINT fk_user_lesson_locks_course_id 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Enable real-time for all relevant tables
ALTER TABLE user_services REPLICA IDENTITY FULL;
ALTER TABLE user_course_assignments REPLICA IDENTITY FULL;
ALTER TABLE user_lesson_locks REPLICA IDENTITY FULL;
ALTER TABLE user_progress REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE services REPLICA IDENTITY FULL;
ALTER TABLE courses REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_services;
ALTER PUBLICATION supabase_realtime ADD TABLE user_course_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_lesson_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE courses;
