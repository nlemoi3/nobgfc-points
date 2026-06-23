import type { ReactNode } from "react";
import Nav from "./components/nav";
import AuthControls from "./components/auth-controls";
import { getCurrentUser, getCurrentUserRole, getCurrentUserAngler } from "../lib/auth";

export const metadata = {
  title: "NOBGFC Points",
  description: "Tournament scoring and standings system",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, role, angler] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
    getCurrentUserAngler(),
  ]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Nav
          role={role}
          authControls={<AuthControls email={user?.email} role={role} anglerId={angler?.id} />}
        />
        {children}
      </body>
    </html>
  );
}

