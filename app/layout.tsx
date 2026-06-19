import type { ReactNode } from "react";
import nav from "./components/nav";

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
        <nav />
        {children}
      </body>
    </html>
  );
}