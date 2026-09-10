export const AUTH_SESSION_READY_EVENT = "nobgfc:auth-session-ready";

export type AuthCallback =
  | {
      kind: "pkce";
      code: string;
      tokenType: string | null;
    }
  | {
      kind: "tokens";
      accessToken: string;
      refreshToken: string | null;
      tokenType: string | null;
    };

export function parseAuthCallback(
  hash: string,
  search: string,
): AuthCallback | null {
  const searchParams = new URLSearchParams(search);
  const code = searchParams.get("code");
  const queryType = searchParams.get("type");

  if (code) {
    return { kind: "pkce", code, tokenType: queryType };
  }

  const hashParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );
  const accessToken = hashParams.get("access_token");

  if (!accessToken) return null;

  return {
    kind: "tokens",
    accessToken,
    refreshToken: hashParams.get("refresh_token"),
    tokenType: hashParams.get("type"),
  };
}
