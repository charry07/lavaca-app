# Human Ops Checklist (Tasks AI Cannot Complete Alone)

Status: pending
Owner: project owner

## Accounts and Access
- [ ] Confirm owner access to Supabase org and create production project
- [ ] Confirm owner access to Vercel team/project
- [ ] Confirm owner access to Stripe account (test + live mode)
- [ ] Confirm owner access to GitHub repo secrets and environment protection rules

## Supabase Console Tasks
- [ ] Create Supabase project region and set database password
- [ ] Obtain `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Obtain `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create service role secret for server-side operations (do not expose to client)
- [ ] Configure auth providers (phone OTP, email if needed)
- [ ] Configure redirect URLs for web auth callbacks
- [ ] Configure storage buckets and public/private policies

## Vercel Dashboard Tasks
- [ ] Create Vercel project and connect repository
- [ ] Set production and preview environment variables
- [ ] Configure domains and DNS
- [ ] Configure serverless region and runtime settings

## Stripe Dashboard Tasks
- [ ] Create products/prices for premium plans
- [ ] Generate `STRIPE_SECRET_KEY`
- [ ] Generate `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Create webhook endpoint and get `STRIPE_WEBHOOK_SECRET`
- [ ] Enable customer portal and billing settings

## Security and Governance
- [ ] Store all secrets in Vercel + GitHub secrets only
- [ ] Rotate any leaked keys immediately
- [ ] Validate least-privilege access for team members

## Go-Live Verification (Owner Signoff)
- [ ] Approve staging smoke test (login, create mesa, join, split, pay)
- [ ] Approve production smoke test
- [ ] Approve rollback instructions before first live release
