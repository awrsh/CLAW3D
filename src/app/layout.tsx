import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claw3D Sample — Multi-floor Office (no gateway)",
  description:
    "Standalone Claw3D office sample with floor, walls, multi-story Tools. No OpenClaw gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
