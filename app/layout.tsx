import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Effects from "@/components/Effects";
import Motion from "@/components/Motion";
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
  openGraph: { type: "website", locale: "ru_RU", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/", images: [{ url: asset("og.jpg"), width: 1200, height: 630, alt: "VELTOR — мотоциклы и автомобили из Южной Кореи под ключ" }] },
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
        {/* fonts are served from this site (scripts/fetch_fonts.py): no requests to Google, so visitors' IPs stay in Russia */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/no-css-tags */}
        <link rel="stylesheet" href={asset("fonts/fonts.css")} />
        {/* sections lay out in full before any jump to an #anchor, so it lands on the right spot (see main>.section in globals.css) */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var d=document.documentElement,off=function(){d.classList.add("cv-off")};if(location.hash)off();addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href*='#']");if(a)off()},true)})()` }} />
        {/* display fonts used below the first screen arrive after the page has loaded and the browser is idle (scripts/late_fonts.py) */}
        <script dangerouslySetInnerHTML={{ __html: `addEventListener("load",function(){var go=function(){var l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(asset("fonts/fonts-late.css"))};document.head.appendChild(l)};window.requestIdleCallback?requestIdleCallback(go,{timeout:2000}):setTimeout(go,300)})` }} />
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
        <Motion />
        <Metrika />
      </body>
    </html>
  );
}
