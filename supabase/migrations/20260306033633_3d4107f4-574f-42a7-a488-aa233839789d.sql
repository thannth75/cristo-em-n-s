
-- Create trigger function for community post notifications
CREATE OR REPLACE FUNCTION public.notify_community_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify all approved users except the poster
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  SELECT p.user_id, '📝 Nova publicação', 
    (SELECT full_name FROM profiles WHERE user_id = NEW.user_id) || ' fez uma publicação na comunidade.',
    'community', '/comunidade'
  FROM public.profiles p
  WHERE p.user_id != NEW.user_id AND p.is_approved = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_community_post_insert
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_community_post();

-- Create trigger function for testimony notifications
CREATE OR REPLACE FUNCTION public.notify_testimony()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  SELECT p.user_id, '✨ Novo testemunho!',
    (SELECT full_name FROM profiles WHERE user_id = NEW.user_id) || ' compartilhou um testemunho.',
    'community', '/testemunhos'
  FROM public.profiles p
  WHERE p.user_id != NEW.user_id AND p.is_approved = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_testimony_insert
AFTER INSERT ON public.testimonies
FOR EACH ROW EXECUTE FUNCTION public.notify_testimony();

-- Create trigger function for prayer request notifications
CREATE OR REPLACE FUNCTION public.notify_prayer_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_private = false THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    SELECT p.user_id, '🙏 Pedido de oração',
      (SELECT full_name FROM profiles WHERE user_id = NEW.user_id) || ' pediu oração. Interceda!',
      'prayer', '/oracoes'
    FROM public.profiles p
    WHERE p.user_id != NEW.user_id AND p.is_approved = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_prayer_request_insert
AFTER INSERT ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_prayer_request();

-- Create trigger for devotional notifications
CREATE OR REPLACE FUNCTION public.notify_new_devotional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  SELECT p.user_id, '📖 Devocional do dia',
    '"' || NEW.title || '" — ' || NEW.bible_reference,
    'devotional', '/devocional'
  FROM public.profiles p
  WHERE p.is_approved = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_devotional_insert
AFTER INSERT ON public.daily_devotionals
FOR EACH ROW EXECUTE FUNCTION public.notify_new_devotional();

-- Create trigger for event notifications
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  SELECT p.user_id, '📅 Novo evento!',
    '"' || NEW.title || '" em ' || NEW.event_date || ' às ' || NEW.start_time,
    'event', '/agenda'
  FROM public.profiles p
  WHERE p.is_approved = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_insert
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.notify_new_event();

-- Create trigger for new story notifications  
CREATE OR REPLACE FUNCTION public.notify_new_story()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  SELECT p.user_id, '📸 Novo story',
    (SELECT full_name FROM profiles WHERE user_id = NEW.user_id) || ' publicou um story.',
    'community', '/comunidade'
  FROM public.profiles p
  WHERE p.user_id != NEW.user_id AND p.is_approved = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_story_insert
AFTER INSERT ON public.user_stories
FOR EACH ROW EXECUTE FUNCTION public.notify_new_story();
