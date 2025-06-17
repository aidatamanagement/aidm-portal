
-- Create a table for admin notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id),
  chat_session_id UUID REFERENCES public.chat_sessions(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'new_message',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view their notifications
CREATE POLICY "Admins can view their notifications" 
  ON public.admin_notifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for system to insert notifications
CREATE POLICY "System can create notifications" 
  ON public.admin_notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for admins to update their notifications
CREATE POLICY "Admins can update notifications" 
  ON public.admin_notifications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enable realtime for admin notifications
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;
