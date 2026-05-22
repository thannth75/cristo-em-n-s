-- 1) Approval gate nas INSERT policies
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create prayers" ON public.prayer_requests;
CREATE POLICY "Users can create prayers" ON public.prayer_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create view records" ON public.profile_views;
CREATE POLICY "Users can create view records" ON public.profile_views
  FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid() AND public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can create testimonies" ON public.testimonies;
CREATE POLICY "Users can create testimonies" ON public.testimonies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can like testimonies" ON public.testimony_likes;
CREATE POLICY "Users can like testimonies" ON public.testimony_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_user_approved(auth.uid()));

-- 2) Revogar EXECUTE público das funções SECURITY DEFINER auxiliares.
-- Elas continuam usáveis pelas políticas RLS (executam como dono).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_leader(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_approved_admin_or_leader(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_user_approved(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_member(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_youth(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_musician(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_access_youth_content(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_city(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_same_city_or_admin(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_view_sensitive_profile_data(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_city(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_audit(text, text, uuid, jsonb, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_level_from_xp(integer) FROM anon, authenticated, public;
-- add_user_xp é chamada por triggers/edge functions; mantém execução apenas pelo próprio usuário via security definer
REVOKE EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, text, uuid, text) FROM anon, public;