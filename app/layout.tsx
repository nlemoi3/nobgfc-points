import type { ReactNode } from "react";
import Nav from "./components/nav";

export const metadata = {
  title: "NOBGFC Points",
  description: "Tournament scoring and standings system",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}