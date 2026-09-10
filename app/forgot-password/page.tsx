"use client";

import Link from "next/link";
import { useState } from "react";
import { getAuthErrorMessage } from "../../lib/auth-error-message";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);
    setSending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();

    if (!email) {
      setError("Email is required.");
      setSending(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    if (resetError) {
      setError(getAuthErrorMessage(resetError, "password-reset"));
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
  }

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Reset Password</h1>
      <p>We’ll email you a link to set a new password.</p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent ? (
        <p
          className="alert"
          style={{
            background: "#eef8f1",
            borderColor: "#cfe8d7",
            color: "#1d5f3d",
          }}
        >
          Reset email sent. Open it in this same browser to choose a new
          password.
        </p>
      ) : null}

      <form onSubmit={handleSubmit}>
        <p className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </p>

        <button type="submit" className="btn" disabled={sending}>
          {sending ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <div style={{ marginTop: "18px" }}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </main>
  );
}
