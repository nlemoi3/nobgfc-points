"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        setError("Open your reset link again so we can verify the request.");
        return;
      }

      setReady(true);
    }

    checkSession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: roleRow } = user
      ? await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

    router.replace(
      roleRow?.role === "admin"
        ? "/admin"
        : roleRow?.role === "weighmaster"
          ? "/admin/catch-entry"
          : "/dashboard",
    );
  }

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Set a New Password</h1>
      <p>Create a new password for your account.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      {ready ? (
        <form onSubmit={handleSubmit}>
          <p className="field">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </p>

          <p className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </p>

          <button type="submit" className="btn">
            Update Password
          </button>
        </form>
      ) : null}
    </main>
  );
}import { updatePassword } from "./actions";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return searchParams.then(({ error }) => (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Create New Password</h1>
      <p>Enter a new password for your account.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      <form action={updatePassword}>
        <p className="field">
          <label htmlFor="password">New Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </p>

        <p className="field">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
        </p>

        <button type="submit" className="btn">
          Update Password
        </button>
      </form>
    </main>
  ));
}