"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AUTH_SESSION_READY_EVENT,
  parseAuthCallback,
} from "../../lib/auth-callback";
import { getAuthLinkErrorMessage } from "../../lib/auth-error-message";
import { createClient } from "../../lib/supabase/client";

export function MagicLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    async function handleAuthCallback() {
      const callback = parseAuthCallback(
        window.location.hash,
        window.location.search,
      );

      if (!callback) return;

      if (callback.kind === "tokens" && !callback.refreshToken) {
        router.replace(
          "/login?error=This authentication link is incomplete. Request one new link and use the newest email.",
        );
        return;
      }

      try {
        const supabase = createClient();

        const { data: sessionData, error } =
          callback.kind === "pkce"
            ? await supabase.auth.exchangeCodeForSession(callback.code)
            : await supabase.auth.setSession({
                access_token: callback.accessToken,
                refresh_token: callback.refreshToken!,
              });

        if (error) {
          console.error("Failed to process auth callback:", error);
          router.replace(
            `/login?error=${encodeURIComponent(getAuthLinkErrorMessage(error))}`,
          );
          return;
        }

        if (!sessionData.session?.user) {
          router.replace(
            "/login?error=We could not verify this authentication link. Request one new link and use the newest email.",
          );
          return;
        }

        window.dispatchEvent(new Event(AUTH_SESSION_READY_EVENT));

        if (
          callback.tokenType === "recovery" ||
          callback.tokenType === "invite" ||
          pathname === "/reset-password"
        ) {
          router.replace("/reset-password");
          return;
        }

        if (callback.tokenType === "signup") {
          router.replace(
            "/login?message=Email confirmed. Sign in with your password.",
          );
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        console.error("Failed to process auth callback:", error);
        router.replace(
          "/login?error=We could not verify this authentication link. Request one new link and use the newest email.",
        );
      }
    }

    handleAuthCallback();
  }, [pathname, router, search]);

  return null;
}
