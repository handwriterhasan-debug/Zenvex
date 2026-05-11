-- Complete Authentication Setup for Zenvex

-- 1. Create the `users` table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE
);

-- 2. Enable Row Level Security (RLS) on the `users` table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policy: users can only access their own row
CREATE POLICY "Users can access own row"
ON public.users
FOR ALL
USING (auth.uid() = id);

-- 4. Automatically add a user to the public.users table after sign up
-- Note: This requires email confirmation to be handled properly!
-- Wait, if email verification is ON, they are added to auth.users immediately,
-- but auth.users.email_confirmed_at is NULL until they click the link.
-- So we insert them as unverified first, and update to verified when they login.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, email_verified, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.created_at, now())
  ) ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
