# Matany Engineering Standards & Autonomous Directives

## 1. Architectural Integrity
- **Single Source of Truth:** `CONTEXT.md` is the authoritative guide to directory layout, component responsibilities, and API maps. Read it before designing or modifying any feature.
- **Dual-Backend Parity:** Ensure every API endpoint added or modified in Express (`server/index.ts`) is synchronized with Vercel Serverless (`api/*.ts`).
- **Zero-Dependency Router:** Strictly maintain the zero-dependency History API router in `src/App.tsx`. Do not install external routing packages.
- **Cognitive Memory Architecture:** Preserve the 3-Tier memory model (Working Memory, Episodic Ledger, Semantic Dynamic Graph with pgvector) and adhere to Supabase schema definitions and RLS policies.

## 2. Code Quality & Standards
- **No Truncation / No Placeholders:** Write production-ready code with complete logic. Never leave `// TODO` or `// ... rest of code`.
- **Strict Typing:** No unvalidated `any`, no `@ts-ignore`. Strictly validate null/undefined boundaries.
- **Streaming Preservation:** Maintain real-time SSE formatting and `AbortController` cancellation semantics on streaming endpoints.

## 3. Verification & Autonomous Healing
- **Build Verification:** Run `npm run build` (`tsc -b && vite build`) to empirically verify zero TypeScript and bundle errors.
- **Self-Healing Debugging:** In case of failure, autonomously inspect stack traces, fix root causes, and re-verify without suppressing errors or deleting assertions.

## 4. Documentation Auto-Sync
- **Context Synchronization:** Whenever a new component, service, route, or library is added or modified, update `CONTEXT.md` before concluding the turn.
