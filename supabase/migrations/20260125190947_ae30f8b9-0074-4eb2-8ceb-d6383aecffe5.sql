
-- =====================================================
-- Remove the overly permissive INSERT policy on profiles
-- The handle_new_user trigger uses SECURITY DEFINER, so it bypasses RLS
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- =====================================================
-- Fix other policies that may cause recursion
-- These policies reference profiles table directly in EXISTS subquery
-- They should use SECURITY DEFINER functions instead
-- =====================================================

-- Fix bible_quizzes
DROP POLICY IF EXISTS "Approved users can view quizzes" ON public.bible_quizzes;
CREATE POLICY "Approved users can view quizzes"
ON public.bible_quizzes
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix bible_studies
DROP POLICY IF EXISTS "Approved users can view studies" ON public.bible_studies;
CREATE POLICY "Approved users can view studies"
ON public.bible_studies
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix chat_messages
DROP POLICY IF EXISTS "Approved users can view chat" ON public.chat_messages;
CREATE POLICY "Approved users can view chat"
ON public.chat_messages
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix community_posts
DROP POLICY IF EXISTS "Approved users can view posts" ON public.community_posts;
CREATE POLICY "Approved users can view posts"
ON public.community_posts
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix events
DROP POLICY IF EXISTS "Approved users can view events" ON public.events;
CREATE POLICY "Approved users can view events"
ON public.events
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix music_scales
DROP POLICY IF EXISTS "Approved users can view scales" ON public.music_scales;
CREATE POLICY "Approved users can view scales"
ON public.music_scales
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix musicians
DROP POLICY IF EXISTS "Approved users can view musicians" ON public.musicians;
CREATE POLICY "Approved users can view musicians"
ON public.musicians
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix post_comments
DROP POLICY IF EXISTS "Approved users can view comments" ON public.post_comments;
CREATE POLICY "Approved users can view comments"
ON public.post_comments
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix post_likes
DROP POLICY IF EXISTS "Approved users can view likes" ON public.post_likes;
CREATE POLICY "Approved users can view likes"
ON public.post_likes
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix quiz_questions
DROP POLICY IF EXISTS "Approved users can view questions" ON public.quiz_questions;
CREATE POLICY "Approved users can view questions"
ON public.quiz_questions
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix scale_musicians
DROP POLICY IF EXISTS "Approved users can view scale musicians" ON public.scale_musicians;
CREATE POLICY "Approved users can view scale musicians"
ON public.scale_musicians
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix scale_songs
DROP POLICY IF EXISTS "Approved users can view scale songs" ON public.scale_songs;
CREATE POLICY "Approved users can view scale songs"
ON public.scale_songs
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix songs
DROP POLICY IF EXISTS "Approved users can view songs" ON public.songs;
CREATE POLICY "Approved users can view songs"
ON public.songs
FOR SELECT
USING (public.is_user_approved(auth.uid()));

-- Fix user_achievements
DROP POLICY IF EXISTS "Anyone can view all earned achievements" ON public.user_achievements;
CREATE POLICY "Approved users can view all achievements"
ON public.user_achievements
FOR SELECT
USING (public.is_user_approved(auth.uid()));
