# Phase 6 — Marketplace and economic empowerment

## Implemented

- Public marketplace catalogue at `/marketplace` with premium product cards and category language.
- Product detail pages at `/marketplace/[slug]`.
- Approved, privacy-safe maker stories and impact notes.
- Stock-aware bag with quantity controls and availability messaging.
- Authenticated order-intent API at `/api/marketplace/orders`.
- Atomic stock reservations with a 30-minute reservation window.
- Customer order history at `/dashboard/orders`.
- Sample catalogue: woven basket, indigo table runner, and seed bead necklace.

## Database

Migration: `supabase/migrations/0007_phase6_marketplace.sql`

The migration creates maker profiles, categories, category links, approved product images, and inventory reservations; extends products and orders for catalogue and fulfilment metadata; adds the `create_marketplace_order` transaction function; applies public/staff RLS boundaries; and seeds the sample maker edit.

## Local verification

Run:

```text
npm run lint
npm run build
npm run start -- -p 3005
```

Then open `/marketplace`. The public catalogue, product detail route, authenticated donor order dashboard, and unauthenticated checkout protection have been verified locally.

## Production completion

Connect the M-Pesa/card checkout provider shared with Phase 5, add payment-event reconciliation for orders, and complete fulfilment, cancellation, refund, customer-support, and sales-impact reporting workflows. The current checkout creates a pending order intent and reserves stock; it does not collect payment details or claim that payment has completed.
