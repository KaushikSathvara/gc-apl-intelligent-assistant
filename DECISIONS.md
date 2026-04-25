# LearnQuest — Architecture & Design Decisions

This file captures key decisions made during development for future reference.

---

## ADR-001: Framework Choice — Next.js 15 (not Vite)

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User requested "Tailwind + Next + Vite." Research confirmed Next.js and Vite **cannot coexist** — they are separate build systems. Next.js uses Turbopack internally for fast dev experience.  
**Decision:** Use **Next.js 15 (App Router)** with Turbopack as the sole framework. Tailwind CSS v4 for styling.  
**Rationale:**
- API routes needed for secure Gemini API key handling (server-side only)
- SSR capability for SEO if needed later
- Turbopack provides Vite-equivalent dev speed
- Single framework simplifies Docker build

---

## ADR-002: State Management — Zustand + localStorage

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** Need to persist user progress, XP, streaks, and learning state. No database specified.  
**Decision:** Use **Zustand** with `persist` middleware (localStorage backend).  
**Rationale:**
- Zero infrastructure cost — no database needed
- Instant reads/writes for gamification state
- Works offline
- Easy to migrate to Supabase later if multi-device sync needed
- Zustand is lightweight (~1KB) vs Redux

---

## ADR-003: Gemini API — 2.0 Flash with Structured Output

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** Need AI-powered content generation with minimal token usage.  
**Decision:** Use **Gemini 2.0 Flash** with JSON schema-constrained output via `responseMimeType: "application/json"`.  
**Rationale:**
- Flash is ~10x cheaper than Pro, still excellent quality
- Structured output eliminates parsing errors and prose overhead (~40% token savings)
- System instructions cached per session reduce repeated context tokens
- Estimated cost: ~$0.02/month for daily use

---

## ADR-004: Design System — Dark-First Premium with Inter

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User requested "mature, not generic AI type" UI. Design system tool suggested playful fonts (Baloo 2, Comic Neue) which were too childish.  
**Decision:** Override design system recommendation. Use:
- **Font:** Inter (all weights) — professional, clean, premium feel
- **Secondary font:** JetBrains Mono for code/data
- **Colors:** OKLCH color space for perceptual uniformity
- **Style:** Dark-first, inspired by Linear/Vercel aesthetic + Duolingo gamification
- **Not:** Generic chatbot UI, childish fonts, neon colors
**Rationale:**
- Inter is the industry standard for premium SaaS/tool products
- OKLCH ensures colors look equally vibrant across light/dark modes
- Dark mode as default signals "developer/power-user" tool, not toy

---

## ADR-005: Dockerization — Multi-Stage Alpine for Cloud Run

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** Need containerized deployment to Google Cloud Run.  
**Decision:** 3-stage Dockerfile: `deps → build → runtime` using `node:20-alpine`.  
**Rationale:**
- Multi-stage reduces final image from ~1GB to ~150MB
- Alpine base minimizes attack surface
- `output: 'standalone'` in next.config.ts produces self-contained server
- Non-root user (`nextjs:1001`) for security
- Health check endpoint for Cloud Run readiness probes

---

## ADR-006: Gamification — XP/Level/Streak/Achievement System

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User wants gamified learning experience.  
**Decision:** 4-pillar gamification:
1. **XP System** — Earned per lesson (50), quiz (100-150), streak (25/day)
2. **Levels** — 10 levels from Novice (0 XP) to Legend (10,000 XP)
3. **Streaks** — Daily learning streak with fire icon, calendar view
4. **Achievements** — 7+ badges for milestones (perfect quizzes, streaks, completions)
**Rationale:**
- Multiple reward loops keep engagement high
- Level titles provide aspiration
- Streak mechanics proven effective (Duolingo, GitHub)
- Achievements add collection/completionist motivation

---

## ADR-007: Token Optimization Strategy

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User explicitly requested minimal Gemini token usage.  
**Decision:** 6-layer optimization:
1. Structured JSON output (no prose) — 40% savings
2. Terse system prompts (single paragraph) — 60% savings
3. Context compression (step titles only, not full content) — 70% savings
4. Client-side caching (never re-fetch) — 100% on repeats
5. Gemini Flash model — 10x cheaper than Pro
6. Batch curriculum generation — amortized cost
**Rationale:** Total estimated cost ~$0.0007 per 30-min session

---

## ADR-008: Multi-Topic Support — Parallel Learning Paths

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User wants parallel topic learning per profile.  
**Decision:** Each user profile contains an array of `LearningTopic` objects, each with independent curriculum, progress, and XP tracking.  
**Rationale:**
- Topics are fully independent — completing one doesn't affect another
- Dashboard shows all active topics as a grid of progress cards
- XP from all topics contributes to a single user level
- Users can pause/resume any topic independently

---

## ADR-009: Package Manager — pnpm (Strictly)

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** User explicitly requested "use pnpm strictly."  
**Decision:** Use **pnpm** exclusively for all package management operations. The Dockerfile uses `corepack enable && corepack prepare pnpm@latest` for container builds.  
**Rationale:**
- Strict user requirement
- Faster installs and disk-efficient via content-addressable store
- Strict dependency resolution prevents phantom dependencies

---


## ADR-010: User-Provided API Keys via Onboarding

**Date:** 2026-04-25  
**Status:** Decided  
**Context:** Users need the ability to provide their own Gemini API key, rather than relying solely on a server-side environment variable. This allows self-hosted or shared deployments where each user brings their own key.  
**Decision:** Add an optional "API Key" step to onboarding (between Profile and Topic) where users can enter their Gemini API key.  
**Key Design:**
- API key stored in `UserProfile.geminiApiKey` via Zustand/localStorage
- Key is sent via `x-gemini-key` request header on API calls
- Server-side routes prefer user key, fall back to `GEMINI_API_KEY` env var
- Client-side validation via a test Gemini API call before proceeding
- Password-masked input with show/hide toggle
- Step is skippable if server-side key is already configured
- Clear security messaging: key stored locally, never on servers  
**Rationale:**
- Enables bring-your-own-key (BYOK) model
- Zero friction for deployments with pre-configured env vars (skip step)
- Key never persisted server-side — only in user's browser localStorage
- Inline validation prevents wasted time with invalid keys

---

*Add new decisions below as they arise during development.*

