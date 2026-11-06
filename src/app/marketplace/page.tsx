import Link from "next/link";

export const metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <>
      <section className="page-hero"><div className="container"><p className="eyebrow">Economic empowerment</p><h1>Buy with purpose. Grow opportunity.</h1><p>The marketplace will help supported women and community groups present and sell products with dignity, clear maker stories, and dependable fulfilment.</p></div></section>
      <section className="section"><div className="container"><div className="empty-state"><p className="eyebrow">Marketplace coming in the commerce phase</p><h3>Products, stories, and orders will appear here.</h3><p className="muted">The foundation layer already reserves the product, inventory, order, and maker-story concepts in the data model. Payment, fulfilment, and seller workflows will be added in sequence.</p><Link className="button" href="/donate">Support the mission meanwhile</Link></div></div></section>
    </>
  );
}
