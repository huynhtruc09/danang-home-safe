import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Role = "landlord" | "tenant";
interface AuthCtx {
  user: User | null;
  roles: Role[];
  loading: boolean;
  refreshRoles: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (uid?: string) => {
    if (!uid) return setRoles([]);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as Role));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setTimeout(() => loadRoles(session?.user?.id), 0);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await loadRoles(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRoles]);

  const value: AuthCtx = {
    user,
    roles,
    loading,
    refreshRoles: () => loadRoles(user?.id),
    signIn: async () => {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    },
    signOut: async () => {
      await supabase.auth.signOut();
      window.location.replace("/");
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
