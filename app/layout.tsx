import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Effects from "@/components/Effects";
import Metrika from "@/components/Metrika";
import JsonLd from "@/components/JsonLd";
import { LINKS, PHONE_HREF, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, asset } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: {
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
  },
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "ru_RU", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/", images: [{ url: asset("feed/f0.jpg"), width: 560, height: 420 }] },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0A0B0D", width: "device-width", initialScale: 1, viewportFit: "cover" };

const ORG = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: "Подбор, осмотр, выкуп и доставка мотоциклов и автомобилей из Южной Кореи под ключ",
  sameAs: [LINKS.channel, LINKS.instagram, LINKS.avito],
  telephone: PHONE_HREF.replace("tel:", ""),
  contactPoint: { "@type": "ContactPoint", contactType: "customer service", telephone: PHONE_HREF.replace("tel:", ""), url: LINKS.manager, availableLanguage: "ru" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Unbounded:wght@200..700&family=Wix+Madefor+Display:wght@400..700&family=Wix+Madefor+Text:wght@400..600&display=swap" />
        <JsonLd data={[ORG, {
          "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE_URL}/#website`,
          url: `${SITE_URL}/`, name: SITE_NAME, alternateName: "ВЕЛТОР", inLanguage: "ru-RU",
          publisher: { "@id": `${SITE_URL}/#organization` },
        }]} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Effects />
        <Metrika />
      </body>
    </html>
  );
}
