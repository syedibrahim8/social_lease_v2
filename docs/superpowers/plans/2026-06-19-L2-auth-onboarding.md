# L2 — Auth + Onboarding Implementation Plan

> Public auth pages + creator/brand onboarding wizards, mock-wired. Gates:
> typecheck + lint + build, plus a light render check of the flow.

**Goal:** A premium, accessible authentication experience (login / register /
forgot / reset / verify) on a split-screen shell, plus stepper-driven creator and
brand onboarding wizards. All forms validate with Zod and (in the mock phase)
simulate success and route forward.

**Architecture:** `(auth)` route group → centered form column + a quiet brand
panel. `(onboarding)` route group → centered card with a progress stepper. Forms
use react-hook-form + Zod via the shadcn `form` primitives. Register picks a role
and routes to that persona's wizard; wizards finish into `/dashboard`. No live
calls yet — the mock `AuthProvider` role is set on register/login.

## Tasks

1. **Options + schemas** — `lib/config/options.ts` (niches, platforms, industries,
   company sizes) and `lib/validations/{auth,onboarding}.ts` (Zod).
2. **Auth shell** — `app/(auth)/layout.tsx` (split) + `components/auth/brand-panel.tsx`
   - `components/auth/auth-card.tsx` (logo, title, subtitle) + `social-auth.tsx`
     (Google button + divider).
3. **Auth forms** — `login-form`, `register-form` (role radio), `forgot-password-form`,
   `reset-password-form`; pages render them. `verify-email` is an informational
   state page (resend + continue).
4. **Onboarding shell + stepper** — `app/(onboarding)/layout.tsx`,
   `components/onboarding/stepper.tsx`.
5. **Creator wizard** — `/onboarding/creator`: profile → audience → payouts
   (Stripe Connect CTA, mock) → verification kickoff → finish.
6. **Brand wizard** — `/onboarding/brand`: company → details → verification → finish.
7. **Wiring** — register routes to the wizard for the chosen role; login →
   `/dashboard`; home page gains Sign in / Get started; account-menu sign out →
   `/login`.
8. **Verify** — typecheck + lint + build; quick render of login + a wizard.
