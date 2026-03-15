# Crawl — Autonomous SEO & GEO Platform

**24/7 autonomous SEO and Generative Engine Optimization platform.** Track keyword rankings, find content gaps, and optimize your visibility in AI-powered search engines like ChatGPT, Perplexity, and Gemini.

---

## What Is This?

Crawl is a multi-tenant SaaS application that combines traditional SEO with **Generative Engine Optimization (GEO)** — making sure your content gets cited by large language models, not just ranked on Google.

Key capabilities:
- **Keyword Ranking Tracker** — Pulls live SERP data via DataForSEO, synced with Google Search Console
- **GEO / LLM Visibility** — Checks how often your site is cited by ChatGPT, Perplexity, and Gemini
- **AI SEO Audits** — Autonomous LangGraph agent runs full SEO + GEO audits on demand
- **AI Blog Generation** — Generates and edits SEO-optimized blog posts with a rich TipTap editor
- **Google Integrations** — Connects to Google Search Console and Google Analytics 4
- **Sandbox Mode** — Time-limited demo environments for prospecting

---

## Architecture Overview

```
genai-genesis/
├── crawl/                        # Turbo monorepo (main project)
│   ├── apps/
│   │   └── web/                  # Next.js 14 frontend
│   │       ├── app/              # App Router pages
│   │       │   ├── dashboard/    # Core app (rankings, GEO, AI blogs, settings)
│   │       │   ├── sandbox/      # Demo/prospect environment
│   │       │   ├── auth/login/   # Authentication
│   │       │   ├── blog/         # Public blog
│   │       │   └── onboarding/   # New user onboarding
│   │       ├── components/       # Shared UI components (Radix-based)
│   │       └── lib/              # Supabase, Gemini, Google OAuth, encryption
│   ├── services/
│   │   └── agent/                # Python FastAPI AI agent service
│   │       ├── main.py           # FastAPI entrypoint
│   │       ├── graphs/
│   │       │   ├── orchestrator.py   # LangGraph orchestrator
│   │       │   ├── seo_graph.py      # SEO audit subgraph
│   │       │   └── geo_graph.py      # GEO/LLM visibility subgraph
│   │       ├── clients/
│   │       │   └── dataforseo.py     # DataForSEO API client
│   │       ├── nodes/            # LangGraph node implementations
│   │       └── tools/            # Agent tool definitions
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.sandbox.yml
│   ├── turbo.json
│   └── vercel.json
└── openclawseo/                  # Alternate branding / earlier iteration
```

---

## Tech Stack

### Frontend (`crawl/apps/web`)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4, Tailwind Animate |
| UI Primitives | Radix UI |
| State | Zustand 4.5 |
| Data Fetching | TanStack Query 5 |
| Tables | TanStack Table 8 |
| Rich Text | TipTap 3 (Markdown/WYSIWYG) |
| Charts | Recharts 2 |
| Validation | Zod 3 |
| Icons | Lucide React |
| Theming | next-themes |
| Command Palette | cmdk |

### Backend Agent (`crawl/services/agent`)

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115 |
| Runtime | Python 3.12, Uvicorn |
| AI Orchestration | LangGraph 0.2, LangChain Core 0.2 |
| LLM | Google Gemini (via `google-generativeai`) |
| SERP Data | DataForSEO API |
| Task Queue | Celery 5.4, Redis |

### Infrastructure

| Service | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Cache / Queue | Upstash Redis + BullMQ |
| Frontend Deploy | Vercel |
| Agent Deploy | Docker |
| Monorepo | Turborepo 2 |

### External Integrations

- **Google Search Console** — keyword impressions, clicks, positions
- **Google Analytics 4** — traffic and conversion data
- **DataForSEO** — SERP rank tracking
- **Perplexity API** — LLM citation checking
- **Framer** — design/content platform integration
- **Google Gemini** — AI audit generation and blog writing

---

## Database Schema (Supabase)

Key tables:

| Table | Purpose |
|---|---|
| `organizations` | Multi-tenant org accounts |
| `profiles` | User profiles, extends Supabase `auth.users` |
| `sites` | Tracked websites with GSC/GA4 credentials |
| `keywords` | Keyword list per site |
| `geo_records` | LLM citation check results |
| `agent_runs` | Audit run history and status |
| `reports` | Generated AI report content |
| `sandbox_environments` | Time-limited demo environments |

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- A Supabase project
- A Google Cloud project (for OAuth + GSC + GA4)
- DataForSEO account
- Google Gemini API key
- Upstash Redis instance

### 1. Clone and Install

```bash
git clone <repo-url>
cd genai-genesis/crawl
npm install
```

### 2. Environment Variables

Create `apps/web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Google OAuth (Search Console + GA4)
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GA4_REDIRECT_URI=http://localhost:3000/api/auth/ga4/callback

# AI
GEMINI_API_KEY=<gemini-api-key>
PERPLEXITY_API_KEY=<optional>

# Framer
FRAMER_API_KEY=<framer-api-key>
FRAMER_PROJECT_ID=<framer-project-id>

# Upstash Redis
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>

# Security
ENCRYPTION_SECRET=<32-char-secret>

# Agent Service
AGENT_SERVICE_URL=http://localhost:8000
AGENT_WEBHOOK_SECRET=<webhook-secret>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SANDBOX_DOMAIN=sandbox.localhost:3000
```

Create `services/agent/.env`:

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
DATAFORSEO_API_LOGIN=<login>
DATAFORSEO_API_PASSWORD=<password>
PERPLEXITY_API_KEY=<optional>
AGENT_WEBHOOK_SECRET=<same-as-above>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start the Agent Service

```bash
cd services/agent
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or via Docker:

```bash
cd docker
docker-compose up --build
```

### 4. Start the Frontend

```bash
cd crawl
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Available Scripts

From `crawl/` (runs all workspaces via Turbo):

```bash
npm run dev          # Start all dev servers
npm run build        # Build all apps
npm run lint         # Lint all code
npm run type-check   # TypeScript type checking
```

From `crawl/apps/web/`:

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
```

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/auth/login` | Auth page (Supabase Auth) |
| `/onboarding` | New user setup flow |
| `/dashboard/overview` | Main dashboard |
| `/dashboard/rankings` | Keyword ranking tracker |
| `/dashboard/geo` | GEO / LLM visibility dashboard |
| `/dashboard/ai-blogs` | AI blog generator with TipTap editor |
| `/dashboard/settings` | Site settings, integrations |
| `/sandbox` | Demo environment |
| `/blog` | Public blog |

### API Routes (`/api/`)

| Route | Description |
|---|---|
| `/api/auth/google/callback` | Google OAuth callback |
| `/api/auth/ga4/callback` | GA4 OAuth callback |
| `/api/agent/webhook` | Receives agent run results from FastAPI |

---

## AI Agent Architecture

The Python agent service uses **LangGraph** to run multi-step SEO and GEO audits asynchronously.

```
Next.js  →  POST /api/agent/run  →  FastAPI  →  LangGraph Orchestrator
                                                       ├── SEO Graph
                                                       │     ├── Fetch GSC data
                                                       │     ├── Run SERP checks
                                                       │     └── Generate AI recommendations
                                                       └── GEO Graph
                                                             ├── Query Perplexity
                                                             ├── Query Gemini
                                                             └── Check citations
FastAPI  →  POST /api/agent/webhook  →  Next.js  (async result delivery)
```

Long-running audits are handled via webhooks since they exceed serverless function timeouts.

---

## Deployment

### Frontend (Vercel)

The project is configured for Vercel deployment:

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "apps/web/.next"
}
```

Push to `main` to trigger automatic deployment.

### Agent Service (Docker)

```bash
cd crawl/docker
docker-compose -f docker-compose.yml up -d
```

For production, expose the agent service via a public URL (e.g., ngrok tunnel or cloud VM) and set `AGENT_SERVICE_URL` accordingly in your frontend environment.

---

## Route Protection

Middleware at `crawl/apps/web/middleware.ts` protects:
- `/dashboard/*` — requires authenticated session
- `/sandbox/control-panel/*` — requires authenticated session
- Logged-in users are redirected away from `/auth/login`

---

## Multi-Tenancy

The platform is fully multi-tenant:
- Users belong to one or more **Organizations**
- Each organization has **Sites** (tracked websites)
- Roles: `admin`, `member`, `viewer`
- **Sandbox environments** provide isolated, time-limited demo access for prospects

---

## License

Private — all rights reserved.
