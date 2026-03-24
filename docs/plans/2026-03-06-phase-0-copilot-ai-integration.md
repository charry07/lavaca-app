# Phase 0 — GitHub Copilot AI Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add an AI layer across La Vaca using the GitHub Copilot ecosystem so users can get intelligent assistance in key flows (session creation, split strategy help, payment guidance, and activity insights).

**Architecture:** Introduce a server-side AI orchestration layer that calls GitHub Models (Copilot ecosystem) with strict guardrails. Mobile app consumes AI endpoints through `api.ts`. Prompt templates and response contracts are centralized to keep behavior deterministic and auditable.

**Tech Stack:** GitHub Models API, TypeScript, Expo mobile client, Supabase (for logs/feature flags), optional Vercel function runtime.

**Conflict rules:**
- Phase 0 can create AI service modules and API contracts only.
- Do not redesign existing UI screens in this phase.
- Do not alter payment business rules without explicit product approval.

Status: pending
Owner: AI Agent E

## Plan Hygiene (Anti-Basura)

- No AI helper should be added without one concrete in-app use case.
- Prompts must live in versioned files; avoid hardcoded prompt strings across screens.
- Every model call must include timeout, retry policy, and safe fallback response.

## Scope

- In scope:
  - AI assistant endpoint contracts.
  - Prompt templates for split recommendation and payment coaching.
  - Feature flag and observability for AI calls.
  - Mobile integration points in existing flows.
- Out of scope:
  - Full conversational redesign of the app.
  - Replacing core split/payment logic with AI.

## Task 1: Define AI product surfaces

**Files:**
- Create: `docs/ai/phase-0-copilot-surfaces.md`
- Modify: `docs/plans/2026-03-05-lavaca-roadmap.md`

**Deliverables:**
- List every in-app touchpoint where AI will be used.
- Define expected input/output for each touchpoint.
- Prioritize P0/P1 rollout order.

## Task 2: Create AI response contracts and shared types

**Files:**
- Modify: `packages/shared/src/types.ts`
- Create: `packages/shared/src/ai.ts`
- Modify: `packages/shared/src/index.ts`

**Deliverables:**
- Strongly typed request/response models for:
  - split recommendation
  - participant reminder suggestions
  - session summary insights
- Include error envelope and fallback payload shape.

## Task 3: Add AI orchestration service

**Files:**
- Create: `apps/mobile/src/services/ai.ts` (client contract)
- Create: `supabase/functions/ai-copilot/index.ts`
- Modify: `.env.example`

**Environment variables:**
- `GITHUB_MODELS_TOKEN`
- `GITHUB_MODELS_MODEL`
- `EXPO_PUBLIC_AI_ENABLED`

**Deliverables:**
- One server endpoint that wraps model calls.
- Timeout + retry + redaction of sensitive data.
- Structured logs for latency, token usage, and failures.

## Task 4: Integrate AI into app flows (incremental)

**Files:**
- Modify: `apps/mobile/app/create.tsx`
- Modify: `apps/mobile/app/session/[joinCode].tsx`
- Modify: `apps/mobile/src/i18n/translations.ts`

**Deliverables:**
- AI split suggestion action during session setup.
- AI-generated reminder suggestion for pending participants.
- Localized UX copy for AI states (loading, success, fallback).

## Task 5: Safety, QA, and rollout controls

**Files:**
- Create: `docs/ai/phase-0-guardrails.md`
- Create: `docs/ai/phase-0-test-matrix.md`
- Modify: `docs/plans/2026-03-05-human-ops-checklist.md`

**Deliverables:**
- Prompt safety rules and blocked categories.
- Test matrix for deterministic and non-deterministic outputs.
- Rollout strategy with feature flags by environment.

## Definition of Done

- [ ] AI surfaces documented and approved.
- [ ] Shared AI contracts exported from `@lavaca/shared`.
- [ ] Copilot/GitHub Models endpoint operational with safe fallback.
- [ ] Mobile integration shipped behind `EXPO_PUBLIC_AI_ENABLED`.
- [ ] i18n keys added in `es`, `en`, `pt`.
- [ ] `pnpm lint` and `pnpm -r typecheck` pass.
- [ ] Human ops checklist includes token/config tasks.

## Changelog

### 2026-03-06

- Phase 0 created to add GitHub Copilot AI integration before upcoming implementation phases.
- Scope and guardrails defined to avoid coupling AI to critical payment logic.
