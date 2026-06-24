import Link from "next/link";
import type { AppRole } from "../../lib/auth";
import { logout } from "../login/actions";

export default function AuthControls({
  email,
  role,
  anglerId,
}: {
  email?: string;
  role: AppRole | null;
  anglerId?: number | string | null;
}) {
  if (!email) {
    return (
      <div className="auth-controls">
        <Link href="/login" className="nav-link">Club Sign In</Link>
      </div>
    );
  }

  return (
    <div className="auth-controls">
      <span className="auth-email">
        {email} {role ? `(${role})` : "(pending approval)"}
      </span>
      <Link href="/account" className="nav-link" style={{ marginLeft: "8px" }}>
        Account
      </Link>
      {anglerId && (
        <Link href={`/anglers/${anglerId}`} className="nav-link" style={{ marginLeft: "8px" }}>My Profile</Link>
      )}
      <form action={logout}>
        <button type="submit" className="signout-btn">Sign Out</button>
      </form>
    </div>
  );
}
