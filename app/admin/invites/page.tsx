import { requireRole } from "../../../lib/auth";
import { sendInvite } from "./actions";

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  await requireRole("admin");
  const { error, sent } = await searchParams;

  return (
    <main className="panel">
      <h1>Invite Members</h1>
      <p>Send a club invite by email or text message. Roles are assigned later by an admin.</p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent === "email" && <p className="alert alert-success">Email invite sent.</p>}
      {sent === "sms" && <p className="alert alert-success">Text invite sent.</p>}

      <form action={sendInvite} className="form-grid">
        <p className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" autoComplete="name" />
        </p>

        <p className="field">
          <label htmlFor="method">Invite Method</label>
          <select id="method" name="method" defaultValue="email">
            <option value="email">Email</option>
            <option value="sms">Text Message</option>
          </select>
        </p>

        <p className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" />
        </p>

        <p className="field">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 504 555 0123"
          />
        </p>

        <div className="field field-full">
          <p className="hint">
            Email invites use Supabase Auth. Text invites send a signup link through Twilio.
          </p>
        </div>

        <div className="field field-full">
          <button type="submit" className="btn">
            Send Invite
          </button>
        </div>
      </form>
    </main>
  );
}