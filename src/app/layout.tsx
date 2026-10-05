// Root layout: the HTML shell every page sits inside. Sets the browser-tab title,
// uses the RAS logo as the tab icon, and applies the white page + charcoal text.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAS Safety",
  description: "Daily site safety forms for Ron Anderson & Sons crews.",
  icons: { icon: "/ras-logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-ras-charcoal antialiased">{children}</body>
    </html>
  );
}
