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
      <Link href="/account" className="auth-email">
        {email} {role ? `(${role})` : "(pending approval)"}
      </Link>
      {anglerId && (
        <Link href={`/anglers/${anglerId}`} className="nav-link auth-profile-link">My Profile</Link>
      )}
      <form action={logout}>
        <button type="submit" className="signout-btn">Sign Out</button>
      </form>
    </div>
  );
}
