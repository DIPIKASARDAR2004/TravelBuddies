"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowserClient";
import {
  createNavbarSession,
  initialNavbarSession,
} from "@/lib/auth/navbarSession";

export function useNavbarSession() {
  const [state, setState] = useState(initialNavbarSession);
  const controller = useRef<ReturnType<typeof createNavbarSession> | null>(
    null,
  );
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const session = createNavbarSession(
      {
        read: () => supabaseBrowser.auth.getUser(),
        // Preserve the existing SDK/global scope: it handles local cookies and broadcasts.
        logout: () => supabaseBrowser.auth.signOut(),
        subscribe: (listener) => {
          const { data } = supabaseBrowser.auth.onAuthStateChange((event) =>
            listener(event),
          );
          return () => data.subscription.unsubscribe();
        },
      },
      setState,
      () => window.location.assign("/"),
    );
    controller.current = session;
    return () => {
      session.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      controller.current?.depart();
    }
  }, [pathname]);
  return {
    ...state,
    check: () => {
      void controller.current?.check();
    },
    logout: () => {
      void controller.current?.logout();
    },
  };
}
