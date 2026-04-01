// app/layout.tsx — ADMVC Cloud (plataforma SaaS)
import type { Metadata } from "next";
import "./globals.css";

import { SITE_NAME } from "@/lib/constants";
import BrandingProvider from "@/components/ui/BrandingProvider";

export const metadata: Metadata = {
  title: `${SITE_NAME} Cloud`,
  description: "Plataforma de gestao integrada para igrejas.",
  metadataBase: new URL("https://app.igrejaadmvc.org"),
  icons: {
    icon: [
      { url: "/images/favicon.ico" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  }
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className="dark">
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
