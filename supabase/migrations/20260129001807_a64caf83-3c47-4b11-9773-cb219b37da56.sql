-- Add cover_url and bio to profiles for enhanced profile pages
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON public.profiles(is_approved);

-- Create table for profile views tracking
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Everyone can see profile views (for the profile owner to see who visited)
CREATE POLICY "Profile owners can see their views" ON public.profile_views
  FOR SELECT USING (profile_user_id = auth.uid());

-- Users can create view records
CREATE POLICY "Users can create view records" ON public.profile_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Create table for user follows (for future social features)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Everyone can see follows
CREATE POLICY "Anyone can see follows" ON public.user_follows FOR SELECT USING (true);

-- Users can follow/unfollow
CREATE POLICY "Users can manage their follows" ON public.user_follows
  FOR ALL USING (follower_id = auth.uid());

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;