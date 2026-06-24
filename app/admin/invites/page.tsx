import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import { setMemberRole } from "../members/actions";
import { sendInvite } from "./actions";

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  noStore();
  await requireRole("admin");
  const { error, sent } = await searchParams;

  const supabase = createAdminClient();
  const [usersResult, rolesResult] = await Promise.allSettled([
    supabase.auth.admin.listUsers({ page: 1, perPage: 100 }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const usersData = usersResult.status === "fulfilled" ? usersResult.value.data : null;
  const usersError = usersResult.status === "fulfilled" ? usersResult.value.error : usersResult.reason;
  const rolesData = rolesResult.status === "fulfilled" ? rolesResult.value.data : [];
  const rolesError = rolesResult.status === "fulfilled" ? rolesResult.value.error : null;

  const rolesByUserId = new Map<string, string>();
  (rolesData || []).forEach((row: { user_id: string; role: string }) => {
    rolesByUserId.set(row.user_id, row.role);
  });

  const users = (usersData?.users || []).map((user) => ({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at || null,
  })) as UserRow[];

  const pendingUsers = users.filter((user) => !rolesByUserId.has(user.id));

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Invite Members</h1>
        <Link href="/admin/members" className="btn btn-ghost">
          Manage Members
        </Link>
      </div>

      <p>Send a club invite by email or text message, then assign a role right here.</p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent === "email" && <p className="alert alert-success">Email invite sent.</p>}
      {sent === "sms" && <p className="alert alert-success">Text invite sent.</p>}
      {usersError && <p className="alert alert-danger">Auth user error: {usersError.message}</p>}

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

      <h2 style={{ marginTop: "34px" }}>Pending Accounts</h2>
      {pendingUsers.length ? (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Created</th>
                <th>Last Sign In</th>
                <th>Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.email || "—"}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</td>
                  <td>
                    <form action={setMemberRole} className="role-assign-form">
                      <input type="hidden" name="user_id" value={user.id} />
                      <select name="role" defaultValue="member">
                        <option value="member">Member</option>
                        <option value="boat">Boat</option>
                        <option value="weighmaster">Weighmaster</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" className="btn btn-ghost">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No pending accounts found.</p>
      )}
    </main>
  );
}