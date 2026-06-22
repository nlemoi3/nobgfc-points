import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "40px" }}>
      <h1>Access Denied</h1>
      <p>Your account does not have permission to use this page.</p>
      <p>
        <Link href="/dashboard">Return to the dashboard</Link>
      </p>
    </main>
  );
}
