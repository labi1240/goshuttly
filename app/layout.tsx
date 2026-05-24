import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoShuttly — Mountain Shuttle Marketplace",
  description:
    "Book and track shuttle rides across the Canadian Rockies. Connect with trusted local operators in Banff, Lake Louise, Jasper, and Whistler.",
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
