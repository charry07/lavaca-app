# Human Ops Checklist (Tasks AI Cannot Complete Alone)

Status: pending
Owner: project owner

## Plan Hygiene (Anti-Basura)

- Esta checklist debe mantenerse sincronizada con avances reales de fases.
- Si una tarea humana deja de aplicar, se elimina para evitar ruido operativo.
- Cualquier nueva dependencia externa debe agregar aqui su validacion humana.

## Shared Change Log (2026-03-05)

- Se agrego esta checklist para cubrir tareas que una IA no puede completar sola.
- Se enlazo desde el roadmap y desde las fases para mantener trazabilidad.
- Se estandarizo el requerimiento de actualizar todos los `.md` con cada avance.
- Se sincronizo esta checklist tras migracion parcial de auth a Supabase (Fase 2).
- Se sincronizo nuevamente tras migracion realtime de Fase 2.
- Se sincronizo checklist tras reemplazo de `api.ts` en Fase 2 para sesiones/grupos/feed.
- Se sincronizo checklist tras limpieza de Fase 2 (sin Socket.IO fallback y sin `baseUrl.ts`).
- Se sincronizo checklist tras desacople de Fase 2 (`apps/api` fuera de workspace activo).
- Se sincronizo checklist tras eliminacion completa de `apps/api/` y workflow legacy asociado.
- Se sincronizo checklist tras limpieza de instrucciones para reflejar estado real sin backend legacy.
- Se sincronizo checklist tras correccion final de README (arquitectura/estructura actualizada).
- Se sincronizo checklist tras hardening final de `api.ts` (Supabase-only) y validaciones globales recientes.
- Se sincronizo checklist tras cierre de lint a 0 warnings y revalidacion de typecheck en workspaces activos.
- Se agregaron prerequisitos humanos para Fase 0 (GitHub Copilot AI / GitHub Models).
- Se documentaron variables exactas requeridas para CI/CD de Fase 3 (Vercel + Supabase public env).

Last sync: 2026-03-06 (update 12)

## Accounts and Access
- [ ] Confirm owner access to Supabase org and create production project
- [ ] Confirm owner access to Vercel team/project
- [ ] Confirm owner access to Stripe account (test + live mode)
- [ ] Confirm owner access to GitHub repo secrets and environment protection rules
- [ ] Confirm owner access to GitHub Models (Copilot ecosystem) for org/repo

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
- [ ] Configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Actions secrets
- [ ] Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in GitHub Actions secrets
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

## GitHub Copilot AI / GitHub Models Tasks
- [ ] Generate and store `GITHUB_MODELS_TOKEN` with least privilege
- [ ] Select and approve `GITHUB_MODELS_MODEL` for production use
- [ ] Define monthly usage/cost guardrails and alert thresholds

## Go-Live Verification (Owner Signoff)
- [ ] Approve staging smoke test (login, create mesa, join, split, pay)
- [ ] Approve production smoke test
- [ ] Approve rollback instructions before first live release
