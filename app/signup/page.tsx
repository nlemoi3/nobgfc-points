import Link from "next/link";
import { signup } from "./actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  return searchParams.then(({ error, sent }) => (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Create Account</h1>
      <p>Self-service club signup. An admin can change your permissions later.</p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent && (
        <p className="alert" style={{ background: "#eef8f1", borderColor: "#cfe8d7", color: "#1d5f3d" }}>
          Account created. Check your email if confirmation is enabled, then sign in.
        </p>
      )}

      <form action={signup}>
        <p className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </p>

        <p className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </p>

        <p className="field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
        </p>

        <button type="submit" className="btn">
          Create Account
        </button>
      </form>

      <div style={{ marginTop: "18px" }}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </main>
  ));
}import { getCurrentUser } from "../../lib/auth";
import { confirmSignup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Complete Your Registration</h1>
      <p>Create a password for your NOBGFC account.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      {!user ? (
        <p className="alert alert-warning">
          Open your invite link again so we can verify your account before you set a password.
        </p>
      ) : null}

      <form action={confirmSignup}>
        <p className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </p>

        <p className="field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            minLength={8}
            required
          />
        </p>

        <button type="submit" className="btn">
          Create Account
        </button>
      </form>

      <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#666" }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "#0066cc" }}>
          Sign in here
        </a>
      </p>
    </main>
  );
}
