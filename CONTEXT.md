# Matany Architecture & High-Density Context (CONTEXT.md)

> **Auto-Generated Architectural Blueprint & Project Context**  
> **Repository:** `Matany` (Autonomous AI Platform & Virtual Memory Engine)  
> **Status:** Active & Synchronized  
> **Last Synchronized:** 2026-09-09

---

## 1. Architecture & Pattern
Matany utilizes a **Modular Dual-Mode Hybrid Architecture** integrating a **Client-Side Reactive SPA** with a **Dual-Mode Backend** (Standalone Express.js for local/VPS execution and Vercel Serverless Functions for Edge deployment):
- **Frontend Pattern:** Component-Driven View-State Architecture. `src/App.tsx` serves as the centralized state coordinator, modal orchestrator, and zero-dependency History API router (`window.history.pushState` / `popstate`). Views (`AppViewMode`: `landing`, `chat`, `pricing`, `limits`, `profile`, `privacy`, `terms`) switch cleanly without third-party router overhead.
- **Backend Pattern:** Decoupled Service Architecture. Route handlers in `server/index.ts` and `api/*.ts` delegate domain logic to isolated server services (`searchEngine`, `linkResolver`, `mediaDownloadService`, `memoryDetectService`, `videoVisionService`, `vpsService`, `imageForensicsService`, `socialVideoService`).
- **Memory Subsystem:** 3-Tier Cognitive Memory Engine (Working Memory, Episodic Ledger, Semantic Dynamic Graph with Vector Embeddings on Supabase PostgreSQL + `pgvector`).

---

## 2. Directory Responsibilities

| Directory | Core Responsibility | Key Modules & Files |
| :--- | :--- | :--- |
| `src/` | React 18 client application source code & root coordinator | `App.tsx`, `main.tsx`, `index.css`, `types.ts` |
| `src/components/` | Application UI screens, pages, and interactive modals | `LandingPage.tsx`, `PricingPage.tsx`, `LimitsPage.tsx`, `TopBar.tsx`, `SidebarDrawer.tsx`, `ArchitectureModal.tsx` |
| `src/components/Chat/` | Conversational interface and search integration | `ChatMessage.tsx`, `ChatWindow.tsx`, `ChatWithSearchIntegration.tsx` |
| `src/components/SearchUI/`| Autonomous search components | `SearchBar.tsx`, `SearchResults.tsx`, `SearchStatus.tsx`, `SourceBadges.tsx` |
| `src/components/ui/` | Primitive UI elements, status cards, and input controls | `ai-chat-input.tsx`, `chat-reasoning.tsx`, `NeuralImageCard.tsx`, `SvgStudioCard.tsx`, `VpsControlRoomCard.tsx`, `DownloadDetectCard.tsx` |
| `src/hooks/` | Reusable React hooks for domain features | `useSearch.ts`, `useSearchCache.ts`, `useSearchHistory.ts` |
| `src/lib/` | Frontend utility functions, parsers & formatters | `utils.ts`, `mediaExtractor.ts`, `imageCompressor.ts`, `smart-content-parser.tsx`, `memoryIntentUtils.ts` |
| `src/services/` | Frontend service integration layer & cloud connectors | `api.ts`, `supabase.ts`, `memoryManager.ts`, `webauthn.ts`, `usageTracker.ts`, `telemetryTracker.ts`, `fathomCyberEngine.ts` |
| `src/types/` | Domain-specific type definitions | `search.ts` (`QueryIntent`, `SearchResult`, `SearchAggregationResult`) |
| `server/` | Express.js standalone server and backend subsystems | `index.ts`, `vpsService.ts`, `youtubeTranscript.ts`, `tiktokService.ts`, `imageForensicsService.ts`, `dynamicParameterTuner.ts` |
| `server/searchEngine/`| Multi-source autonomous search engine | `index.ts`, `queryProcessor.ts`, `intentClassifier.ts`, `multiSourceSearcher.ts`, `resultsAggregator.ts`, `cacheManager.ts` |
| `api/` | Vercel Serverless Functions mirroring Express routes | `chat.ts`, `search.ts`, `download-detect.ts`, `download-stream.ts`, `resolve-link.ts`, `telemetry.ts`, `vps.ts`, `early-access.ts` |
| `tests/` | Master test suite (Unit, Integration, E2E, Stress, Bench)| `unit/`, `integration/`, `e2e/`, `performance/`, `benchmark/`, `runAllTests.ts` |
| `public/` | Static assets, branding, and crawler manifests | `matany-logo.svg`, `robots.txt`, `sitemap.xml` |

---

## 3. Client Navigation & API Endpoints

### Client-Side Routes (`src/App.tsx` ViewMode):
- `/` or `/chat` -> `chat` (Active Chat Interface, supports query params `?c={chatId}` or `?chat={chatId}`)
- `/landing` -> `landing` (Landing Page)
- `/pricing` -> `pricing` (Pricing & Subscription Tiers)
- `/limits` -> `limits` (Model Rate Limits & Quotas)
- `/profile` -> `profile` (User Profile & Key Management)
- `/privacy` or `/privacy-policy` -> `privacy` (Privacy Policy)
- `/terms` or `/terms-of-service` -> `terms` (Terms of Service)

### Dual Backend API Map (`server/index.ts` & `api/*.ts`):
- **Chat & Inference:** `POST /api/chat` (SSE Streaming LLM completion with OpenRouter / DeepSeek fallback, cognitive reasoning `<think>`, memory tools, and dynamic parameter tuning).
- **Link & Media Resolution:**
  - `POST /api/resolve-link`, `GET /api/resolve-link` (OpenGraph, brand assets, tech stack profiling via Cheerio).
  - `POST /api/youtube-transcript`, `GET /api/youtube-transcript` (Transcript extraction & context blocks).
  - `POST /api/tiktok`, `GET /api/tiktok` (User profile and video extraction).
  - `POST /api/download-detect`, `GET /api/download-detect` (Universal multi-platform media download links).
  - `GET /api/download-stream` (Proxied media streaming pipeline).
- **Autonomous Search:** `GET /api/search`, `POST /api/search` (Multi-source parallel search: Google, DuckDuckGo, Serper, News, Wikipedia).
- **Cognitive Memory Subsystem:**
  - `POST /api/memory/detect` (Semantic entity & intent detection).
  - `POST /api/memory/index` (Store & vectorize memory nodes).
  - `POST /api/memory/update` (Update memory record).
  - `POST /api/memory/link` (Create dynamic graph relationship edges).
  - `GET /api/memory/graph/:chatId` (Retrieve memory knowledge graph for chat session).
- **VPS & Cloud Infrastructure:**
  - `GET /api/vps/telemetry` (Remote SSH2 host telemetry, CPU, RAM, disk, PM2 processes).
  - `POST /api/vps/exec` (Secure remote command execution).
  - `POST /api/vps/automation` (Control remote automation daemons).
- **Platform & Subscriptions:**
  - `GET /api/health` (Service health check).
  - `GET /api/early-access-status`, `POST /api/early-access`, `POST /api/early-access-action` (Early access pipeline).
  - `POST /api/verify-subscription-code` (Tier unlocking).
  - `POST /api/telemetry` (Client performance & telemetry logging).

---

## 4. Data Entities & Storage Models

### Client Models (`src/types.ts`):
- `ChatMessageItem`: Chat message structure with roles, reasoning thoughts, vision keyframes, attachments, memory triggers, and VPS payloads.
- `ModelType`: Supported models (`fathom-quant-3`, `deepseek-v4-flash`, `deepseek-v4-pro-cyber-2.6`, `meta/muse-spark-1.2-contributor`, etc.).
- `ResolvedLinkInfo`: Scraped link profile, OpenGraph, tech-stack recognition, brand assets.
- `DownloadDetectResult`: Media download formats, video streams, audio qualities, galleries.
- `SemanticMemoryRecord`: Cognitive memory entry, entities, keywords, vector similarity, RRF score.
- `ChatGraphEdge`: Cross-session graph relation (`SUPERSEDES`, `EXTENDS`, `DEPENDS_ON`, `SAME_PROJECT`, `RELATES_TO`, `CONTRADICTS`).
- `VpsTelemetryData` & `VpsExecutionResult`: Host metrics, process list, bash command output.
- `WebAuthnVerificationResult`: Hardware security key & biometric authentication status.

### Supabase PostgreSQL Database (`supabase_schema.sql`):
- `public.x1_chats`: Chat sessions (`id`, `user_id`, `title`, `model`, `is_x1`, timestamps).
- `public.x1_messages`: Message history (`id`, `chat_id`, `role`, `content`, `reasoning`, `tokens_count`).
- `public.x1_subscriptions`: User subscription tiers (`user_id`, `plan_id`, `status`, `current_period_end`).
- `public.x1_usage`: Token usage tracking per user and period.
- `public.x1_activation_rate_limits`: Rate limiting for access/activation requests.
- `public.x1_semantic_memories`: Semantic memory nodes with pgvector embeddings (`embedding vector(1536)`), entities, keywords.
- `public.x1_chat_links`: Dynamic graph relations between chat sessions.

---

## 5. State & Data Flow
- **State Strategy:** Zero external state management libraries (No Redux, Zustand, or Recoil).
- **Central State Hub (`src/App.tsx`):**
  - Messages array (`ChatMessageItem[]`) and active conversation ID.
  - Active model (`ModelType`).
  - X1 Mode toggle & Biometric unlock state (`WebAuthn`).
  - Active view mode (`AppViewMode`) synchronized via History API.
  - User session & Supabase Auth state (`User | null`).
  - Subscription plan (`free-0`, `pro-29`, `elite-99`) and quota tracking.
- **Custom React Hooks:**
  - `useSearch`: Coordinates real-time search execution, debounce, and query states.
  - `useSearchCache`: Search result in-memory caching.
  - `useSearchHistory`: User search history persistence.
- **Persistent / Singleton Services:**
  - `memoryEngine` (`src/services/memoryManager.ts`): Client memory orchestrator.
  - `supabase` (`src/services/supabase.ts`): Supabase client singleton for cloud chats and OAuth.
  - `usageTracker` (`src/services/usageTracker.ts`): Token estimation and usage enforcement against plan limits.
  - `telemetryTracker` (`src/services/telemetryTracker.ts`): Client-side telemetry stream.
  - `localStorage`: Fast caching for age-verification tokens, landing page views, and cached active plan.

---

## 6. Active Tech Stack

- **Core Runtime & Build:** TypeScript 5.7.2, Node.js, `tsx` (v4.19.3), Vite 6.1.0
- **Frontend Framework:** React 18.3.1, React DOM 18.3.1
- **Styling & Animation:** Tailwind CSS 3.4.17, PostCSS 8.5.2, Framer Motion 13.1.1, Lucide React 1.33.0, Radix UI Accordion
- **Rich Content & Math:** `react-markdown` 9.0.3, `remark-gfm` 4.0.0, `remark-math` 6.0.0, `rehype-katex` 7.0.1, `katex` 0.18.4, `prismjs` 1.30.0
- **Backend & Networking:** Express 4.21.2, CORS 2.8.5, Server-Sent Events (SSE), Cheerio 1.2.0, SSH2 1.17.0, `ai` 7.0.77
- **Database, Auth & Cloud:** `@supabase/supabase-js` 2.112.3 (PostgreSQL, Auth, Storage, `pgvector`), WebAuthn API
- **AI Inference Providers:**
  - OpenRouter (`anthracite-org/magnum-v4-72b`, `meta/muse-spark-1.2-contributor`)
  - DeepSeek API (`deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `deepseek-v4-pro-cyber-2.6`, etc.)
- **Testing Suite:** Playwright (`@playwright/test` 1.63.0), JSDOM 30.0.1, custom TypeScript test runners

---

## 7. Architectural Rules & Constraints

1. **Dual-Environment Parity:** The project runs on both local Express (`server/`) and Vercel Serverless (`api/`). Any backend endpoint change must be reflected in both environments or abstracted into a shared service.
2. **State Centralization:** Do NOT introduce external state management libraries (Redux, Zustand, MobX). All shared UI state belongs in `src/App.tsx` or specialized modular custom hooks.
3. **Strict Attribution Mandate:** All system prompts must preserve the developer attribution directive (`Mohamed Ahmed Matany`).
4. **Biometric Security Gate:** NSFW NANO (+21 MAX) and X1 mode features must strictly pass WebAuthn verification (`src/services/webauthn.ts`).
5. **Streaming & Cancellation:** All LLM completion calls must support `AbortController` cancellation across both client and server to preserve token budgets and prevent hanging sockets.
6. **Zero Code Truncation:** Never use `// ... rest of code` or omit imports/types when modifying files.
7. **Context Synchronization:** Whenever a new module, page, endpoint, or dependency is added or modified, update `CONTEXT.md` to reflect the change.
8. **Neural Image Studio Invariants:** All image modifications and additions must preserve the conversational latent `seed`, suppress prompt enhancement (`enhance=false`) to eliminate environment and background hallucination, preserve exact proportional dimensions (`16:9` -> 1344x768, `9:16` -> 768x1344, `4:3` -> 1152x864, `1:1` -> 1024x1024), and ensure the dual-image comparison slider uses valid image URIs (filtering out template placeholders).
9. **Enterprise Reliability & UI Polish Invariants:** All backend responses (Express & Edge) attach unique `x-request-id` UUID headers, expose `GET /api/health`, and emit RFC 7807/OpenAI standard error envelopes `{ error: { message, code, type } }`. The frontend follows Claude/ChatGPT dignified styling with chronological chat drawer grouping (`اليوم`, `أمس`, `آخر 7 أيام`, `الأشهر السابقة`), concise universal prompt placeholder (`اكتب استفسارك أو رسالتك هنا...`), and polite intellectual Fusha Arabic prompts without conversational filler.

