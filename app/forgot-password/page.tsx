import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Reset Password</h1>
      <p>We’ll email you a link to set a new password.</p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent && (
        <p className="alert" style={{ background: "#eef8f1", borderColor: "#cfe8d7", color: "#1d5f3d" }}>
          Reset email sent. Check your inbox and follow the link to choose a new password.
        </p>
      )}

      <form action={requestPasswordReset}>
        <p className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </p>

        <button type="submit" className="btn">
          Send Reset Link
        </button>
      </form>

      <div style={{ marginTop: "18px" }}>
        <Link href="/login">Back to sign in</Link>
      </div>
    </main>
  );
}