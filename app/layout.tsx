// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description:
    "Assembleia de Deus – Ministério Visão de Conquista. Uma igreja acolhedora, comunitária e centrada na Palavra de Deus.",

  // ✅ Ajusta para o teu domínio atual (provisório) – troca depois para https://www.igrejaadmvc.org
  metadataBase: new URL("https://admvc-site.vercel.app"),

  // ✅ Favicons + Apple icon + PWA
  manifest: "/site.webmanifest",
  // themeColor: "#3f6b4f",
  icons: {
    icon: [
      { url: "/images/favicon.ico" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport = {
  themeColor: '#000000', // ou a cor figueira
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className="dark">
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
