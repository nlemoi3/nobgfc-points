import Nav from "./components/Nav";
import SiteNav from "./components/SiteNav";

export const metadata = {
  title: "NOBGFC Points",
  description: "Tournament scoring and standings system",
};

export default function RootLayout({
  <SiteNav />
  children,
}: {
  children: React.ReactNode;
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