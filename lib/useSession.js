"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Client-side identity fetch for the given role ("admin"). Route protection
// itself happens server-side in proxy.js — this hook only powers the display
// (name/avatar) and the logout action.
export function useSession(role) {
  const router = useRouter();
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${role}/me`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setIdentity(json[role]);
      } else {
        setIdentity(null);
      }
    } catch {
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch(`/api/auth/${role}/logout`, { method: "POST" });
    setIdentity(null);
    router.push(`/${role}/login`);
    router.refresh();
  }, [role, router]);

  return { identity, loading, refresh, logout };
}
