# Phase 2 — Identity, roles, and secure application shell

Status: implementation slice complete; privileged access controls and production hardening remain.

## What is now working

- Supabase email/password sign-in.
- Supabase magic-link sign-in for existing accounts.
- Public account registration with email verification support.
- Password reset and password update flows.
- OAuth-style callback exchange through `/auth/callback` with a safe, same-origin path guard.
- Session-aware protected `/dashboard` route group.
- Server-side user lookup with `auth.getUser()` before rendering the private shell.
- Role visibility from the RLS-protected `user_roles` table.
- Account and security pages inside the private workspace.
- TOTP authenticator enrollment and verification using Supabase MFA.
- Sign-out that clears the local Supabase session.

## Supabase dashboard configuration

For local testing, configure Authentication → URL Configuration with:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

When staging or production is created, add those exact HTTPS callback URLs as separate entries. Do not use a wildcard redirect URL.

Email confirmation and password recovery emails should be enabled before inviting real users. The email templates should preserve the callback URL and use the foundation’s approved privacy and safeguarding language.

## Deliberate boundaries in this slice

- A newly registered user is not automatically a staff member, beneficiary, partner, or volunteer.
- No browser code can assign roles, elevate privileges, or use a service-role key.
- Role assignment, invite-only staff onboarding, staff MFA enforcement, and audit events for sensitive operations are the next identity hardening slice.
- MFA enrollment is available to the signed-in user, but the application does not yet block privileged staff from sensitive routes until MFA is verified.

## Verification checklist

1. Register a test account and confirm the email.
2. Sign in with a password and with a magic link.
3. Request a password reset and complete the update flow.
4. Open `/dashboard` while signed out and confirm it redirects to `/login`.
5. Enroll and verify an authenticator factor from `/dashboard/security`.
6. Confirm `.env.local` and all secrets remain absent from Git.
7. Test each role against the database policies before adding private program or payment records.

## Files in this slice

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/auth/update-password/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/security/page.tsx`
- `src/components/sign-out-button.tsx`

