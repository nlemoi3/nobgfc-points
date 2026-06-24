import { getCurrentUserRole } from "../../lib/auth";
import { confirmSignup } from "./actions";
import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const role = await getCurrentUserRole();

  // If already signed in, redirect to dashboard
  if (role) {
    redirect(
      role === "admin"
        ? "/admin"
        : role === "weighmaster"
          ? "/admin/catch-entry"
          : "/dashboard",
    );
  }

  const { token, error } = await searchParams;

  // If no token, redirect to login
  if (!token) {
    redirect("/login");
  }

  return (
    <main className="panel" style={{ margin: "60px auto", maxWidth: "460px" }}>
      <h1>Complete Your Registration</h1>
      <p>Create a password for your NOBGFC account.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      <form action={confirmSignup}>
        <input type="hidden" name="token" value={token} />

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
