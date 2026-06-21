# L3 — Landing Page Implementation Plan

> Public marketing landing at `/`. Gates: typecheck + lint + build + render.

**Goal:** A premium, investor-ready marketing page — hero with a product preview,
social proof, features, how-it-works, a Brands/Creators split, a stats band, a
testimonial, transparent commission "pricing", and a final CTA — on a scroll-aware
nav + footer shell. Stripe/Vercel/Linear aesthetic, dark-mode aware, subtle motion.

**Architecture:** A `(marketing)` route group owns `/`. `(marketing)/layout.tsx`
renders `MarketingNav` (transparent → solid on scroll) + children + `Footer`. The
page composes section components from `components/marketing/`. The old root holding
page (`app/page.tsx`) is removed (it collided with the marketing group at `/`).

## Tasks

1. **Shell** — `app/(marketing)/layout.tsx`, `components/marketing/marketing-nav.tsx`
   (scroll-aware, links + Sign in/Get started + theme toggle), `components/marketing/footer.tsx`.
2. **Hero** — `hero.tsx` (headline, subhead, CTAs, trust line) + `hero-preview.tsx`
   (a framed mock dashboard built from the design system).
3. **Proof + Features + How-it-works** — `logos.tsx`, `features.tsx` (grid),
   `how-it-works.tsx` (3 steps).
4. **Audience + Stats + Testimonial** — `audience.tsx` (For Brands / For Creators),
   `stats.tsx` (GMV/payouts band), `testimonial.tsx`.
5. **Pricing + CTA** — `pricing.tsx` (transparent 10% commission), `cta.tsx` (final band).
6. **Page** — `app/(marketing)/page.tsx` composes the sections with motion reveals.
7. **Verify** — typecheck + lint + build + render.
