import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole } from "../../../lib/auth";
import { getAdminUsers } from "../../../lib/admin-users";
import { setMemberRole } from "./actions";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  noStore();
  await requireRole("admin");

  const { error, sent } = await searchParams;
  const { users, error: usersError } = await getAdminUsers();
  const pendingUsers = users.filter((user) => !user.role);

  return (
    <main className="panel">
      <div className="toolbar">
        <h1>Manage Members</h1>
        <Link href="/admin" className="btn btn-ghost">
          Back to Admin
        </Link>
      </div>

      <p>
        Use this page to assign club roles after someone signs up.
      </p>

      {error && <p className="alert alert-danger">{error}</p>}
      {sent && <p className="alert alert-success">Role updated.</p>}
      {usersError && <p className="alert alert-danger">Auth user error: {usersError.message}</p>}

      <h2>Pending Accounts</h2>
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

      <h2>All Accounts</h2>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Last Sign In</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email || "—"}</td>
                <td>{user.role || "pending"}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
