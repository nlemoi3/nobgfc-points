import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
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
  );
}