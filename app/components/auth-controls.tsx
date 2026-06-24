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
      <details className="auth-menu">
        <summary className="auth-menu-trigger">
          <span className="auth-email">
            {email} {role ? `(${role})` : "(pending approval)"}
          </span>
        </summary>
        <div className="auth-menu-panel">
          <Link href="/account">Account Settings</Link>
          {anglerId && (
            <Link href={`/anglers/${anglerId}`}>My Profile</Link>
          )}
          <form action={logout}>
            <button type="submit" className="signout-btn">Sign Out</button>
          </form>
        </div>
      </details>
    </div>
  );
}
