import type { ReactNode } from "react";
import { Outfit, Fraunces } from "next/font/google";
import Nav from "./components/nav";
import AuthControls from "./components/auth-controls";
import { MagicLinkHandler } from "./components/magic-link-handler";
import { getCurrentUser, getCurrentUserRole, getCurrentUserAngler } from "../lib/auth";
import "./globals.css";

const bodyFont = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
});

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
      <body className={`app-shell ${bodyFont.variable} ${headingFont.variable}`}>
        <MagicLinkHandler />
        <Nav
          role={role}
          authControls={<AuthControls email={user?.email} role={role} anglerId={angler?.id} />}
        />
        <div className="page-shell">{children}</div>
      </body>
    </html>
  );
}

