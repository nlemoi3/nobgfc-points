import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserAngler } from "../../lib/auth";
import { updateAccount } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; warning?: string }>;
}) {
  const [user, angler, query] = await Promise.all([
    getCurrentUser(),
    getCurrentUserAngler(),
    searchParams,
  ]);

  if (!user) {
    redirect("/login?next=/account");
  }

  return (
    <main className="panel">
      <h1>Account Settings</h1>
      <p>Update your contact details and sign-in email.</p>

      {query.error && <p className="alert alert-danger">{query.error}</p>}
      {query.success && <p className="alert alert-success">{query.success}</p>}
      {query.warning && <p className="alert alert-warning">{query.warning}</p>}

      {!angler && (
        <p className="alert alert-warning">
          Your account is not linked to an angler profile yet. Contact an admin if
          you need profile fields synced.
        </p>
      )}

      <form action={updateAccount}>
        <div className="form-grid">
          <p className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              defaultValue={user.email || angler?.email || ""}
              required
            />
            <span className="hint">
              Changing email may require confirmation via Supabase email link.
            </span>
          </p>

          <p className="field">
            <label>Phone Number</label>
            <input
              name="phone_number"
              type="tel"
              defaultValue={angler?.phone_number || ""}
              placeholder="+1 504 555 0123"
            />
          </p>

          <p className="field">
            <label>Date of Birth</label>
            <input
              name="date_of_birth"
              type="date"
              defaultValue={angler?.date_of_birth || ""}
            />
          </p>

          <p className="field field-full">
            <label>Address</label>
            <input
              name="address"
              defaultValue={angler?.address || ""}
              placeholder="Street address"
            />
          </p>

          <p className="field-full">
            <button type="submit" className="btn">
              Save Account
            </button>
          </p>
        </div>
      </form>
    </main>
  );
}
