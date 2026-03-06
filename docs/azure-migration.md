# Azure Migration Guide

When migrating from Vercel to Azure, the deployment model stays mostly the same.

## What changes
- Hosting changes from Vercel static hosting to Azure Static Web Apps.
- Serverless runtime changes from Vercel Functions to Azure Functions.
- Supabase stays the same (Auth, Postgres, Realtime), so app/domain logic remains unchanged.

## Migration steps
1. Create an Azure Static Web Apps resource.
2. Connect the GitHub repository and branch.
3. Let Azure generate the workflow file for Static Web Apps deployment.
4. Copy environment variables from Vercel/GitHub secrets to Azure App Settings:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
5. Port `apps/vercel-functions/api/*.ts` handlers to Azure Functions (`@azure/functions` v4).
6. Update Stripe webhook endpoint URL in Stripe Dashboard.
7. Remove Vercel deploy steps only after Azure preview/prod are verified.

## Notes
- Keep the same root build command: `pnpm vercel-build` can be renamed later to a neutral command.
- Keep `.env.example` as the source of truth for variable names.
- Run the same quality gates before switching traffic:
- `pnpm -r typecheck`
- `pnpm lint`
- `pnpm build:web`

## Rollback strategy
- Keep Vercel project active until Azure production is validated.
- If Azure release fails, switch traffic back to Vercel and redeploy previous known-good build.
