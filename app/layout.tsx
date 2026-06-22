import type { ReactNode } from "react";
import Nav from "./components/nav";
import AuthControls from "./components/auth-controls";
import { getCurrentUser, getCurrentUserRole } from "../lib/auth";

export const metadata = {
  title: "NOBGFC Points",
  description: "Tournament scoring and standings system",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, role] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
  ]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Nav
          role={role}
          authControls={<AuthControls email={user?.email} role={role} />}
        />
        {children}
      </body>
    </html>
  );
}

