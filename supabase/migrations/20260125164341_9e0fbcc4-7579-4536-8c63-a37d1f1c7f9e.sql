-- 1. Criar enum para os papéis do app
CREATE TYPE public.app_role AS ENUM ('jovem', 'lider', 'admin');

-- 2. Criar tabela de perfis
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    birth_date DATE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Criar tabela de papéis de usuário (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'jovem',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Função security definer para verificar papéis (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- 6. Função para verificar se é admin ou líder
CREATE OR REPLACE FUNCTION public.is_admin_or_leader(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'lider')
    )
$$;

-- 7. Função para obter o email do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT email FROM auth.users WHERE id = _user_id
$$;

-- 8. Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and leaders can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and leaders can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_or_leader(auth.uid()));

-- 9. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Função para criar perfil e atribuir papel automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_full_name TEXT;
    user_email TEXT;
BEGIN
    -- Pegar nome e email do usuário
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
    user_email := NEW.email;
    
    -- Criar perfil
    INSERT INTO public.profiles (user_id, full_name, email, is_approved)
    VALUES (
        NEW.id, 
        user_full_name, 
        user_email,
        -- Admin técnico é aprovado automaticamente
        CASE WHEN user_email = 'nathan.pires755@gmail.com' THEN TRUE ELSE FALSE END
    );
    
    -- Atribuir papel
    IF user_email = 'nathan.pires755@gmail.com' THEN
        -- Admin técnico recebe papel de admin automaticamente
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
        -- Outros usuários recebem papel de jovem (pendente aprovação)
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'jovem');
    END IF;
    
    RETURN NEW;
END;
$$;

-- 12. Trigger para executar após criação de usuário
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();