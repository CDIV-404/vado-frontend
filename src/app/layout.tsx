import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "VADO — Scroll into another dimension",
  description:
    "VADO is a short-form video network wrapped in glass. Discover creators, share moments, and ride a feed tuned to you.",
};

export const viewport: Viewport = {
  themeColor: "#080B18",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2338C9FF'/%3E%3Cstop offset='.5' stop-color='%23287CFF'/%3E%3Cstop offset='1' stop-color='%238057FF'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M20 18l12 28 12-28h-8l-4 11-4-11z' fill='white'/%3E%3C/svg%3E"
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
