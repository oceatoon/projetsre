import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export interface SessionUser {
  id: string;
  email: string | null;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const current = data.session?.user;
      setUser(current ? { id: current.id, email: current.email ?? null } : null);
      setReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(current ? { id: current.id, email: current.email ?? null } : null);
      setReady(true);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, ready, signedIn: Boolean(user) };
}
