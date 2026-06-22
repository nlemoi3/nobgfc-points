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
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        margin: "60px auto",
        maxWidth: "420px",
        padding: "0 20px",
      }}
    >
      <h1>Club Sign In</h1>
      <p>Use your approved NOBGFC account.</p>

      {error && <p style={{ color: "#b42318" }}>{error}</p>}

      <form action={login}>
        <input type="hidden" name="next" value={next} />

        <p>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <p>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={{ boxSizing: "border-box", padding: "8px", width: "100%" }}
          />
        </p>

        <button type="submit" style={{ padding: "9px 16px" }}>
          Sign In
        </button>
      </form>
    </main>
  );
}
