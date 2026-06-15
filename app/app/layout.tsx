export const metadata = {
  title: "NOBGFC Standings",
  description: "Tournament scoring and standings system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}