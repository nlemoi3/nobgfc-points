import Link from "next/link";
import { getCurrentUserRole } from "../../lib/auth";
import { login } from "./actions";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const role = await getCurrentUserRole();

  if (role) {
    redirect(
      role === "admin"
        ? "/admin"
        : role === "weighmaster"
          ? "/admin/catch-entry"
          : "/dashboard",
    );
  }

  const { error, next = "" } = await searchParams;

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Club Sign In</h1>
      <p>Use your approved NOBGFC account.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      <form action={login}>
        <input type="hidden" name="next" value={next} />

        <p className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </p>

        <p className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </p>

        <button type="submit" className="btn">
          Sign In
        </button>
      </form>

      <div style={{ marginTop: "18px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
        <Link href="/signup">Create an account</Link>
        <a href="/forgot-password">Forgot password?</a>
      </div>
    </main>
  );
}
