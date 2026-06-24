"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function MagicLinkHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      const hash = window.location.hash;
      const code = searchParams.get("code");

      // Check for confirmation token (email verification/signup)
      if (code) {
        // Redirect to signup with the confirmation code
        router.push(`/signup?token=${encodeURIComponent(code)}`);
        return;
      }

      // Check for access_token (existing magic link flow - auto sign-in)
      // This handles password reset or existing user magic links
      if (hash.includes("access_token")) {
        try {
          const supabase = await import("../../lib/supabase/client").then(
            (m) => m.createClient(),
          );

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Failed to process sign in link:", error);
          router.push("/login?error=Failed to process sign in link");
        }
      }
    }

    handleAuthCallback();
  }, [router, searchParams]);

  return null;
}
