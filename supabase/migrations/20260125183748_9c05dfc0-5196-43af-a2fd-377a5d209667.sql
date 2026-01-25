-- Fix hardcoded admin email in handle_new_user trigger
-- Replace with a configuration-based approach using an admin_emails table

-- Create a table for configuring admin emails (more secure than hardcoding)
CREATE TABLE IF NOT EXISTS public.admin_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key text UNIQUE NOT NULL,
    config_value text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage config
CREATE POLICY "Admins can manage config" ON public.admin_config
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the initial admin email into config (can be changed later via admin panel)
INSERT INTO public.admin_config (config_key, config_value) 
VALUES ('initial_admin_email', 'nathan.pires755@gmail.com')
ON CONFLICT (config_key) DO NOTHING;

-- Update the trigger function to use the config table instead of hardcoded email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_full_name TEXT;
    user_email TEXT;
    is_initial_admin BOOLEAN;
BEGIN
    -- Get name and email from user
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
    user_email := NEW.email;
    
    -- Check if this email is configured as initial admin (from config table)
    SELECT EXISTS (
        SELECT 1 FROM public.admin_config 
        WHERE config_key = 'initial_admin_email' 
        AND config_value = user_email
    ) INTO is_initial_admin;
    
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email, is_approved)
    VALUES (
        NEW.id, 
        user_full_name, 
        user_email,
        is_initial_admin
    );
    
    -- Assign role
    IF is_initial_admin THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'jovem');
    END IF;
    
    RETURN NEW;
END;
$function$;