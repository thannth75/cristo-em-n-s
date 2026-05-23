-- 1) Re-grant EXECUTE on role/approval helpers used inside RLS policies.
-- Without these grants, evaluating RLS raises "permission denied for function ..."
-- which breaks reads on profiles, user_roles and any table whose policies call them.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_user_approved(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_leader(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_admin_or_leader(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_member(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_youth(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_musician(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_youth_content(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_city(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_same_city_or_admin(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_sensitive_profile_data(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_city(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, text, uuid, text) TO authenticated;

-- 2) Birthday messages table
CREATE TABLE IF NOT EXISTS public.birthday_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  birthday_year integer NOT NULL DEFAULT extract(year from now())::int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_birthday_messages_recipient_year
  ON public.birthday_messages (recipient_id, birthday_year DESC, created_at DESC);

ALTER TABLE public.birthday_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read birthday messages"
  ON public.birthday_messages FOR SELECT
  TO authenticated
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can send birthday messages"
  ON public.birthday_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_user_approved(auth.uid())
    AND sender_id <> recipient_id
  );

CREATE POLICY "Author or recipient can delete birthday message"
  ON public.birthday_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);