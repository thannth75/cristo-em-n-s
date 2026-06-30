import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type AuthReturn = ReturnType<typeof useAuth>;

interface UseAuthRedirectOptions {
  extraCheck?: (auth: AuthReturn) => boolean;
  redirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { extraCheck, redirectTo = "/dashboard" } = options;
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.user) {
      navigate("/auth");
      return;
    }

    if (!auth.isApproved) {
      navigate("/pending");
      return;
    }

    if (extraCheck && !extraCheck(auth)) {
      navigate(redirectTo);
    }
  }, [
    auth.isLoading,
    auth.user,
    auth.isApproved,
    extraCheck,
    redirectTo,
    navigate,
    auth,
  ]);

  return auth;
}
