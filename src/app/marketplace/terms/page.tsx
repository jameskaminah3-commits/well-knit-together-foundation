import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Marketplace terms" };
export default function MarketplaceTermsPage() {
  return <LegalPage eyebrow="Marketplace" title="Good work deserves clear terms." intro="These terms explain the basics of buying approved maker products through the foundation’s marketplace." updated="10 November 2026"><h2>Product information</h2><p>Each listing should describe the product, maker story, price, currency, and availability honestly. Handcrafted items may have small differences that are part of the work.</p><h2>Reservations and orders</h2><p>A reservation is not a completed order until the payment and stock checks succeed. We do not promise stock after a reservation expires or a payment fails.</p><h2>Delivery and returns</h2><p>Delivery details, timing, and return options should be confirmed with the order record. If something arrives damaged or is not what you ordered, contact the foundation promptly with the order reference.</p><h2>Maker dignity</h2><p>Maker stories are shared with permission and should not be copied, misrepresented, or used to identify private household circumstances.</p></LegalPage>;
}
