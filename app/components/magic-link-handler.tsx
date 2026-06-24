"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const tokenType = params.get("type");
      const accessToken = params.get("access_token");

      if (!accessToken) {
        return;
      }

      try {
        const supabase = createClient();

        const { data: sessionData, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Failed to process auth callback:", error);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (!sessionData.session?.user) {
          router.replace("/login?error=Failed to establish session from invite link");
          return;
        }

        if (tokenType === "invite") {
          router.replace("/signup");
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        console.error("Failed to process auth callback:", error);
        router.replace("/login?error=Failed to process sign in link");
      }
    }

    handleAuthCallback();
  }, [router, searchParams]);

  return null;
}
