import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wild Wild Fire",
  description: "Real-time multiplayer Uno All Wild — every card is on fire.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
