import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Fraunces } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { contactChannels, foundation } from "@/lib/site";
import "./globals.css";

// Atkinson Hyperlegible was designed with the Braille Institute for low-vision
// readers: a deliberate choice for a disability-inclusion organisation.
const bodyFont = Atkinson_Hyperlegible_Next({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap", fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"], adjustFontFallback: false });
const displayFont = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-display", display: "swap", axes: ["opsz", "SOFT"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Well Knit Together Global Foundation · Support for caregivers of children with disabilities",
    template: "%s | Well Knit Together Global Foundation",
  },
  description: `${foundation.description} Serving ${foundation.counties.join(", ")}.`,
  applicationName: foundation.legalName,
  keywords: ["caregivers of children with disabilities", "disability inclusion Kenya", "NGO Mombasa", "women caregivers", "Kilifi", "Kwale", "Tana River", "Kajiado", "orphans and vulnerable children", "economic empowerment"],
  openGraph: {
    title: "Well Knit Together Global Foundation",
    description: foundation.tagline + " Support for women caregivers of children with disabilities in coastal Kenya and Kajiado.",
    type: "website",
    locale: "en_KE",
    siteName: foundation.legalName,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#1e3a3f",
  width: "device-width",
  initialScale: 1,
};

function organizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: foundation.legalName,
    alternateName: foundation.name,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    description: foundation.mission,
    nonprofitStatus: "Nonprofit",
    identifier: { "@type": "PropertyValue", propertyID: "NGOs Co-ordination Board, Kenya", value: foundation.registration.number },
    address: { "@type": "PostalAddress", postOfficeBoxNumber: "93175", postalCode: "80102", addressLocality: "Mombasa", addressCountry: "KE" },
    areaServed: foundation.counties.map((county) => ({ "@type": "AdministrativeArea", name: `${county} County, Kenya` })),
    knowsAbout: ["Disability inclusion", "Caregiver support", "Women's economic empowerment", "Orphans and vulnerable children"],
    ...(contactChannels.phone || contactChannels.email ? { contactPoint: { "@type": "ContactPoint", contactType: "general enquiries", areaServed: "KE", availableLanguage: ["English", "Swahili"], ...(contactChannels.phone ? { telephone: contactChannels.phone } : {}), ...(contactChannels.email ? { email: contactChannels.email } : {}) } } : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd() }} />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
