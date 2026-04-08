-- Supabase Database Setup

-- 1. Create the user_state table to store the entire application state as JSONB
CREATE TABLE IF NOT EXISTS public.user_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow users to select their own state
CREATE POLICY "Users can view own state" 
ON public.user_state 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own state
CREATE POLICY "Users can insert own state" 
ON public.user_state 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own state
CREATE POLICY "Users can update own state" 
ON public.user_state 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_state_modtime
BEFORE UPDATE ON public.user_state
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- 5. Storage Setup (for avatars and attachments)
-- Create a new storage bucket called 'user-uploads'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow users to upload files to their own folder (e.g., user_id/filename)
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Complaints Setup
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Users can insert their own complaints
CREATE POLICY "Users can insert own complaints" 
ON public.complaints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own complaints
CREATE POLICY "Users can view own complaints" 
ON public.complaints 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all complaints (we'll handle admin check in the app)
CREATE POLICY "Admins can view all complaints" 
ON public.complaints 
FOR SELECT 
USING (true);

-- Admins can update complaints
CREATE POLICY "Admins can update complaints" 
ON public.complaints 
FOR UPDATE 
USING (true);
