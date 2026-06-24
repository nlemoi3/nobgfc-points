import { updatePassword } from "./actions";

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