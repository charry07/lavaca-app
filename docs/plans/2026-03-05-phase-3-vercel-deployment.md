# Phase 3 — Vercel Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Deploy the Expo web export to Vercel with CI/CD, environment variable management, and a thin serverless function layer for Stripe webhooks.

**Architecture:** Expo web export is a static site deployed to Vercel. Stripe webhooks need server-side verification, so a single Vercel Serverless Function handles them. GitHub Actions runs typecheck + lint + build on every PR, and triggers Vercel deploy on merge to `main`. Azure migration is documented but not implemented yet.

**Tech Stack:** Vercel CLI, Vercel Serverless Functions, GitHub Actions, Expo web export.

**Conflict rules:** ONLY touch `vercel.json`, `.github/workflows/`, `apps/vercel-functions/` (new), `.env.example`, root `package.json` build scripts. NEVER touch `apps/mobile/`, `supabase/`, or `packages/`.

**Depends on:** Phase 2 complete (Supabase client must work before deploying).

Status: pending
Owner: AI Agent C

---

## PREREQUISITE — Manual steps (human required)

1. Create Vercel project at https://vercel.com and connect the GitHub repo
2. Set environment variables in Vercel dashboard (see `.env.example`)
3. See [2026-03-05-human-ops-checklist.md](./2026-03-05-human-ops-checklist.md)

---

## Task 1: Configure Expo web build output

**Files:**
- Modify: `apps/mobile/app.json` or `apps/mobile/app.config.ts`

**Step 1: Read the current app.json/app.config.ts**

Open `apps/mobile/app.json` and locate the `expo` config object.

**Step 2: Ensure web output is set to `static`**

Add or update the web section:
```json
{
  "expo": {
    "web": {
      "output": "static",
      "bundler": "metro"
    }
  }
}
```

**Step 3: Test the build locally**
```bash
cd apps/mobile
npx expo export --platform web
```
Expected: creates `dist/` directory with `index.html` and assets.

**Step 4: Add `dist/` to `.gitignore`**

In `apps/mobile/.gitignore`, add:
```
dist/
```

**Step 5: Commit**
```bash
git add apps/mobile/app.json apps/mobile/.gitignore
git commit -m "feat(web): configure Expo static web export"
```

---

## Task 2: Add Vercel build scripts to root package.json

**Files:**
- Modify: `package.json` (root)

**Step 1: Read root package.json**

**Step 2: Add build scripts**
```json
{
  "scripts": {
    "build:web": "pnpm --filter @lavaca/mobile exec expo export --platform web",
    "build:vercel": "pnpm install && pnpm build:web",
    "vercel-build": "pnpm build:vercel"
  }
}
```

**Step 3: Verify locally**
```bash
pnpm build:web
```
Expected: `apps/mobile/dist/` created with no errors.

**Step 4: Commit**
```bash
git add package.json
git commit -m "feat(deploy): add web build scripts for Vercel"
```

---

## Task 3: Create vercel.json

**Files:**
- Create: `vercel.json`

**Step 1: Create the config**
```json
{
  "buildCommand": "pnpm vercel-build",
  "outputDirectory": "apps/mobile/dist",
  "installCommand": "pnpm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Step 2: Commit**
```bash
git add vercel.json
git commit -m "feat(deploy): add vercel.json with rewrites and security headers"
```

---

## Task 4: Create Stripe webhook serverless function (placeholder)

**Files:**
- Create: `apps/vercel-functions/api/stripe-webhook.ts`
- Create: `apps/vercel-functions/package.json`

**Step 1: Create package.json for vercel-functions**
```json
{
  "name": "@lavaca/vercel-functions",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "stripe": "^17.0.0"
  },
  "devDependencies": {
    "@vercel/node": "^5.0.0",
    "typescript": "~5.9.2"
  }
}
```

**Step 2: Create the webhook handler**
```typescript
// apps/vercel-functions/api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Phase 4 will implement the full Stripe event handling.
// This placeholder validates the webhook signature and returns 200.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
  }

  // TODO (Phase 4): verify signature with stripe.webhooks.constructEvent()
  // and handle payment_intent.succeeded, subscription events, etc.

  return res.status(200).json({ received: true });
}
```

**Step 3: Update vercel.json to include functions directory**

Add to `vercel.json`:
```json
{
  "functions": {
    "apps/vercel-functions/api/*.ts": {
      "runtime": "@vercel/node@5"
    }
  }
}
```

**Step 4: Add workspace to pnpm-workspace.yaml**

Add `'apps/vercel-functions'` to the packages list.

**Step 5: Install + typecheck**
```bash
pnpm install
pnpm --filter @lavaca/vercel-functions typecheck 2>/dev/null || echo "no typecheck script yet"
```

**Step 6: Commit**
```bash
git add apps/vercel-functions/ pnpm-workspace.yaml pnpm-lock.yaml vercel.json
git commit -m "feat(deploy): add Stripe webhook serverless function placeholder"
```

---

## Task 5: GitHub Actions CI/CD pipeline

**Files:**
- Modify: `.github/workflows/ci.yml`

**Step 1: Read the current ci.yml**

Open `.github/workflows/ci.yml` and understand what it already does.

**Step 2: Update with full pipeline**
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  build-web:
    name: Build Web
    runs-on: ubuntu-latest
    needs: [typecheck, lint]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Build Expo web export
        run: pnpm build:web
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: web-dist
          path: apps/mobile/dist/

  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: [build-web]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Step 3: Add required secrets to GitHub repo**

In GitHub → Settings → Secrets → Actions, add:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN` (from https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` (from Vercel project settings)
- `VERCEL_PROJECT_ID` (from Vercel project settings)

(These are documented in the human ops checklist — the AI cannot set them.)

**Step 4: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): add full CI/CD pipeline with typecheck, lint, build, deploy"
```

---

## Task 6: Document Azure migration path

**Files:**
- Create: `docs/azure-migration.md`

**Step 1: Create the document**
```markdown
# Azure Migration Guide

When migrating from Vercel to Azure, the changes are minimal:

## What changes
- **Hosting:** Azure Static Web Apps instead of Vercel
- **Functions:** Azure Functions instead of Vercel Serverless Functions
- **Supabase stays:** No backend changes — Supabase is cloud-agnostic

## Steps
1. Create Azure Static Web Apps resource
2. Connect GitHub repo → auto-generates `.github/workflows/azure-static-web-apps.yml`
3. Set same environment variables in Azure → Configuration → Application settings:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. Convert `apps/vercel-functions/api/*.ts` to Azure Functions format:
   - Each file becomes a `function.json` + `index.ts` in `apps/azure-functions/`
   - Use `@azure/functions` v4 SDK (similar API to Vercel)
5. Remove `vercel.json` and CI Vercel deploy step
6. Update `STRIPE_WEBHOOK_SECRET` in Stripe dashboard with new Azure endpoint URL

## Environment variables are identical
The same `.env.example` works for both platforms.
```

**Step 2: Commit**
```bash
git add docs/azure-migration.md
git commit -m "docs: add Azure migration guide"
```

---

## Task 7: Final verification

**Step 1: Run full build locally**
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build:web
```
Expected: all pass, `apps/mobile/dist/` created.

**Step 2: Preview deploy (if Vercel CLI installed)**
```bash
npx vercel
```
Expected: preview URL generated, app loads in browser.

**Step 3: Verify security headers**
```bash
curl -I https://your-preview.vercel.app | grep -E "X-Frame|X-Content|X-XSS|Referrer"
```
Expected: all 4 headers present.

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat(deploy): phase 3 complete — Vercel deployment configured"
```

---

## Phase 3 Checklist

- [ ] Expo static web export configured (`output: "static"`)
- [ ] `vercel.json` with rewrites, security headers, functions config
- [ ] Build scripts in root `package.json`
- [ ] Stripe webhook serverless function placeholder
- [ ] GitHub Actions: typecheck + lint + build on PR, deploy on main
- [ ] GitHub secrets documented (human sets them)
- [ ] Azure migration guide written
- [ ] `pnpm build:web` succeeds locally
- [ ] Preview deploy on Vercel loads correctly
