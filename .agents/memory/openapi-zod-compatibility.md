---
name: OpenAPI and Zod compatibility
description: The current workspace's generated Zod package is v3-compatible, so OpenAPI integer schemas emit unsupported z.int().
---

When adding OpenAPI numeric fields, prefer `type: number` with explicit minimum/maximum constraints unless the workspace Zod generation/runtime is upgraded together.

**Why:** Orval generated `z.int()` for OpenAPI `integer`, but the installed Zod runtime did not expose that API, which broke shared-library typechecking after otherwise successful codegen.

**How to apply:** Run API codegen and `pnpm run typecheck:libs` immediately after spec changes; only use `integer` after confirming the generated validator compiles.