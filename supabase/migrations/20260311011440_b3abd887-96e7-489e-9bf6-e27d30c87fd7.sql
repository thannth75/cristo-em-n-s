-- Update handle_new_user to save extra fields from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_full_name TEXT;
    user_email TEXT;
    user_phone TEXT;
    user_birth_date TEXT;
    user_city TEXT;
    user_state TEXT;
    is_initial_admin BOOLEAN;
BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
    user_email := NEW.email;
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_birth_date := NEW.raw_user_meta_data->>'birth_date';
    user_city := NEW.raw_user_meta_data->>'city';
    user_state := NEW.raw_user_meta_data->>'state';
    
    SELECT EXISTS (
        SELECT 1 FROM public.admin_config 
        WHERE config_key = 'initial_admin_email' 
        AND config_value = user_email
    ) INTO is_initial_admin;
    
    INSERT INTO public.profiles (user_id, full_name, email, phone, birth_date, city, state, is_approved)
    VALUES (
        NEW.id, 
        user_full_name, 
        user_email,
        user_phone,
        user_birth_date,
        user_city,
        user_state,
        is_initial_admin
    );
    
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