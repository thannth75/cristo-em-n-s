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
  city: string | null;
  state: string | null;
  is_profile_complete: boolean | null;
}

type AppRole = "jovem" | "lider" | "admin" | "membro" | "musico";

interface UserRole {
  role: AppRole;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isLeader: boolean;
  isYouth: boolean;
  isMember: boolean;
  isMusician: boolean;
  isProfileComplete: boolean;
  userCity: string | null;
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
    isYouth: false,
    isMember: false,
    isMusician: false,
    isProfileComplete: false,
    userCity: null,
  });

  useEffect(() => {
    const fetchUserData = async (user: User) => {
      try {
        // Buscar profile e roles em paralelo
        const [profileResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
        ]);

        const profile = profileResult.data as Profile | null;
        const userRoles = (rolesResult.data || []) as UserRole[];
        
        const isAdmin = userRoles.some((r) => r.role === "admin");
        const isLeader = userRoles.some((r) => r.role === "lider");
        const isYouth = userRoles.some((r) => r.role === "jovem");
        const isMember = userRoles.some((r) => r.role === "membro");
        const isMusician = userRoles.some((r) => r.role === "musico");

        setState({
          user,
          profile,
          roles: userRoles,
          isLoading: false,
          isApproved: profile?.is_approved ?? false,
          isAdmin,
          isLeader,
          isYouth,
          isMember,
          isMusician,
          isProfileComplete: profile?.is_profile_complete ?? false,
          userCity: profile?.city ?? null,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setState((s) => ({ ...s, isLoading: false }));
      }
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
          isYouth: false,
          isMember: false,
          isMusician: false,
          isProfileComplete: false,
          userCity: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Helper para verificar se pode acessar conteúdo de jovens
  const canAccessYouthContent = state.isYouth || state.isLeader || state.isAdmin;
  
  // Helper para verificar se pode acessar área de músicos
  const canAccessMusicianContent = state.isMusician || state.isLeader || state.isAdmin;

  return { 
    ...state, 
    signOut,
    canAccessYouthContent,
    canAccessMusicianContent,
  };
}
