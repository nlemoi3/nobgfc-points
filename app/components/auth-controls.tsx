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
  if (!role) {
    return (
      <div style={{ marginLeft: "auto" }}>
        <Link href="/login">Club Sign In</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: "10px",
        marginLeft: "auto",
      }}
    >
      <span style={{ fontSize: "13px" }}>
        {email} ({role})
      </span>
      {anglerId && (
        <Link href={`/anglers/${anglerId}`} style={{ marginLeft: "8px" }}>My Profile</Link>
      )}
      <form action={logout}>
        <button type="submit">Sign Out</button>
      </form>
    </div>
  );
}
