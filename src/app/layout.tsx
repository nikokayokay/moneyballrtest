import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zai Studios | Roblox Creator Portfolio",
  description: "Portfolio for Zai Studios, a Roblox creator brand instrumental in achieving 353+ million visits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
