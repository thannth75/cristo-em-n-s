import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  is_approved: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
}

interface UserRole {
  role: "jovem" | "lider" | "admin";
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isLeader: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    isLoading: true,
    isApproved: false,
    isAdmin: false,
    isLeader: false,
  });

  useEffect(() => {
    const fetchUserData = async (user: User) => {
      // Buscar profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Buscar roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = (roles || []) as UserRole[];
      const isAdmin = userRoles.some((r) => r.role === "admin");
      const isLeader = userRoles.some((r) => r.role === "lider");

      setState({
        user,
        profile: profile as Profile | null,
        roles: userRoles,
        isLoading: false,
        isApproved: profile?.is_approved ?? false,
        isAdmin,
        isLeader,
      });
    };

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });

    // Escutar mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState({
          user: null,
          profile: null,
          roles: [],
          isLoading: false,
          isApproved: false,
          isAdmin: false,
          isLeader: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signOut };
}
