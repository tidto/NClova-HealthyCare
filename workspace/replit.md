# HealthyCare Voice EMR

의료진이 문진 대화를 검토 가능한 EMR 초안으로 정리하도록 돕는 Voice EMR MVP입니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/voice-emr run dev` — run the Voice EMR web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional secret: `NVIDIA_API_KEY` — enables DeepSeek extraction; no key uses the rule-based fallback

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/voice-emr` — clinician-facing React/Vite app
- `artifacts/api-server` — Express API routes and NVIDIA/fallback extraction
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/api-client-react` — generated React Query hooks
- `lib/api-zod` — generated request/response validators
- `lib/db/src/schema` — Drizzle PostgreSQL schema
- `docs/PROJECT_OVERVIEW.md` — product meaning, execution flow, scope decisions, and model notes

## Architecture decisions

- AI output is a reviewable documentation draft, never a diagnosis or treatment recommendation.
- NVIDIA NIM is the preferred provider, but the app keeps a deterministic rule-based fallback so an unconfigured development environment remains usable.
- The original project idea's speech and agent layers are intentionally deferred until their data, tools, and safety boundaries are defined.
- The transcript is stored with the structured result so clinicians can compare source context with the generated draft.
- Generated OpenAPI helpers are used by the frontend and server instead of duplicating the contract.

## Product

- Enter patient details and a consultation transcript.
- Generate and review CC, duration, present illness, and symptom keywords.
- Save and browse recent EMR drafts.
- See the currently active AI provider and model status.

## User preferences

- Keep ambiguous, high-complexity features deferred rather than silently inventing behavior.
- Prefer a small, runnable MVP over broad autonomous medical functionality.

## Gotchas

- Do not put `NVIDIA_API_KEY` in source control or documentation; use Replit Secrets.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm --filter @workspace/db run push` after changing the Drizzle schema.
- Real patient data requires access control, audit logging, retention, encryption, and privacy review before production use.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
