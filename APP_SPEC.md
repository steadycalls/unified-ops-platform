# Unified Operations Platform — Combined App Specification

## 0. Objective

One agency control plane with three subaccounts: Logic Inbound (LI), SitePanda, and Decisions Unlimited (DU). Each subaccount is isolated by domain, RBAC, integrations, webhooks, and API keys. Agency users see cross‑org metrics via the master dashboard.

## 1. Scope

- **Agency → Subaccount hierarchy**
- **Subaccounts:** LI, SitePanda, DU
- **Per‑subaccount modules:** Intake, Onboarding, Fulfillment, QA, Reporting, Billing, R&D Lab, Asset Registry, System Health
- **Unique modules:**
  - LI: AI Site Audit Tool
  - SitePanda: 3‑Click Site Builder
  - DU: GMB Asset & CTR Management

## 2. Domains & Routing

### Production Domains
- **LI** → `my.logicinbound.com`
- **DU** → `my.decisionsunlimited.io` (Note: Currently `ducrm.com` in database, needs migration)
- **SitePanda** → `my.sitepanda.com` (Note: Currently `sitepandaseo.com` in database, needs migration)
- **Agency Master** → Root domain with GHL‑style org switcher

### Routing Implementation
- **Middleware:** Resolves `Host` header → `org_id`
- **JWT:** Carries `org_id` and `role` in token payload
- **RLS:** Row-Level Security enforces isolation at database level
- **Nginx:** Reverse proxy configuration at `/etc/nginx/` (production server: 104.225.223.44)

### Technical Notes
- Next.js rewrites handle `/api/*` routing to backend
- Environment variable `NEXT_PUBLIC_API_URL` must be set for API proxy
- Backend runs on internal port 3001, frontend on 3000
- All external traffic goes through Nginx on ports 80/443

## 3. Auth & RBAC

### Authentication Provider
- **Supabase Auth** with JWT tokens
- **Access Token:** Short-lived (1 hour)
- **Refresh Token:** Long-lived (7 days)
- **Storage:** LocalStorage for web clients

### Role Hierarchy

#### Subaccount Roles (org-scoped)
- `admin` - Full control within org
- `manager` - Limited admin capabilities
- `user` - Read-only or task execution

#### Agency Roles (cross-org)
- `super_admin` - Full access to all orgs and agency dashboard
- `super_manager` - View all orgs, manage specific orgs
- `super_user` - View-only access across permitted orgs

### Implementation Details
- **Table:** `user_organization_roles(user_id, org_id, role)`
- **Middleware:** Validates JWT and checks role bindings
- **RLS Policies:** Filter data by `org_id` based on user's role bindings
- **Test Credentials:** `admin@unified-ops.com` / `Admin123!` (super_admin with access to all 3 orgs)

## 4. Communications per Subaccount

### LI (Logic Inbound)
- **Platform:** Discord
- **Credentials:** Discord Bot token, channel map per org
- **Use Cases:** Channels, alerts, digests, slash commands

### SitePanda
- **Platform:** Slack
- **Credentials:** Slack Bot token + Signing Secret per org
- **Use Cases:** Channels, alerts, digests, slash commands

### DU (Decisions Unlimited)
- **Platform:** Slack
- **Credentials:** Slack Bot token + Signing Secret per org
- **Use Cases:** Channels, alerts, digests, slash commands

### UI Implementation
- **Integrations Page:** Shows correct comms provider per subaccount
- **Health Checks:** Real-time connection status
- **Re-auth Flow:** OAuth refresh when tokens expire

## 5. Keys & Secrets (org‑scoped)

### Per-Subaccount Credentials
- **OpenAI API key** - For AI features (site audits, content generation)
- **DataForSEO API credentials** - For SEO data and rankings
- **Duda API** - SitePanda only (site builder integration)
- **GHL v2 API** - GoHighLevel CRM integration
- **Stripe API** - Payment processing and billing
- **GA4 API** - Google Analytics data
- **Google Drive/Sheets API** - Document management

### Secrets Management
- **Table:** `org_secrets(org_id, provider, key_ref, meta, rotated_at, enc_blob)`
- **Encryption:** KMS (Key Management Service) for `enc_blob` field
- **Access:** Backend only, never exposed to frontend
- **Rotation:** Automated alerts when keys are >90 days old
- **Audit:** All secret access logged with timestamp and user

### Environment Variables (Backend)
```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services (fallback if org-specific not set)
OPENAI_API_KEY=...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
```

### Environment Variables (Frontend)
```bash
NEXT_PUBLIC_API_URL=http://backend:3001
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 6. Webhooks Framework

### Inbound Webhooks (per subaccount, per data type)
- `/wh/{org}/intake/lead` - New lead capture
- `/wh/{org}/ghl/pipeline` - GoHighLevel pipeline updates
- `/wh/{org}/billing/stripe` - Stripe payment events
- `/wh/{org}/ga4/event` - Google Analytics events
- `/wh/{org}/gmb/status` - Google My Business status changes
- `/wh/{org}/crawler/audit` - Site audit completion
- `/wh/{org}/slack` or `/wh/{org}/discord` - Slash commands, interactive actions

### Outbound Webhooks (per subaccount, per event type)

#### Destination Registry
**Table:** `webhook_endpoints(id, org_id, event_key, url, secret, active, last_status, retry_count, last_delivery_at)`

#### Event Keys
- `lead.created` - New lead entered system
- `project.created` - New project/client onboarded
- `task.updated` - Task status changed
- `audit.completed` - Site audit finished
- `site.built` - SitePanda site published
- `gmb.status_changed` - GMB listing status update
- `report.ready` - Weekly report generated
- `invoice.delinquent` - Payment overdue

#### Delivery Mechanism
- **Signature:** HMAC-SHA256 signed with endpoint secret
- **Headers:**
  ```
  X-Webhook-Signature: sha256=...
  X-Webhook-Event: lead.created
  X-Webhook-Org: sitepanda
  X-Webhook-Timestamp: 1234567890
  ```
- **Retries:** Exponential backoff (1s, 2s, 4s, 8s, 16s, 32s)
- **DLQ:** Dead Letter Queue for failed deliveries after 6 attempts
- **Monitoring:** Delivery success rate per endpoint

## 7. Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 3.3+ with custom design system
- **Components:** shadcn/ui + custom components
- **State:** React hooks + localStorage for auth
- **Build:** Docker multi-stage build
- **Deployment:** Docker Compose on production server

#### Frontend Structure
```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with Inter font
│   ├── globals.css         # Tailwind + custom CSS variables
│   ├── login/page.tsx      # Auth page
│   ├── dashboard/page.tsx  # Main dashboard
│   ├── components/         # Shared components
│   │   ├── ProfessionalSidebar.tsx
│   │   └── SearchAndFilters.tsx
│   └── [org-specific pages]
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS with Tailwind plugin
├── next.config.js          # Next.js config with API rewrites
└── package.json
```

#### Critical Frontend Configuration

**postcss.config.js** (REQUIRED for Tailwind to work):
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**tailwind.config.js**:
```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom org colors
      },
    },
  },
  plugins: [],
}
```

**next.config.js**:
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}
```

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js with TypeScript
- **Database:** Supabase Postgres with RLS
- **Edge Functions:** Supabase Edge Functions for real-time features
- **Authentication:** JWT validation middleware
- **Logging:** Winston with structured logs

#### Backend Structure
```
backend/
├── src/
│   ├── server.js           # Express app entry point
│   ├── middleware/
│   │   ├── auth.js         # JWT validation
│   │   ├── orgContext.js   # Org resolution from domain
│   │   └── rateLimiter.js  # Rate limiting
│   ├── routes/
│   │   ├── auth.js         # Login, refresh, logout
│   │   ├── webhooks.js     # Inbound webhook handlers
│   │   └── [modules]
│   ├── services/
│   │   ├── secrets.js      # KMS encryption/decryption
│   │   └── [integrations]
│   └── db/
│       └── migrations/
└── package.json
```

#### Critical Backend Configuration

**server.js** (REQUIRED settings):
```javascript
const express = require('express');
const app = express();

// CRITICAL: Trust proxy for rate limiter to work behind Nginx
app.set('trust proxy', true);

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation since we trust proxy
  validate: false,
});
```

### Automation
- **Platform:** n8n (self-hosted)
- **Queues:** Redis-backed job queues
- **Retries:** Configurable per workflow
- **DLQ:** Failed jobs moved to dead letter queue
- **Credentials:** Org-scoped, stored in n8n vault

### Events
- **Pattern:** Outbox pattern
- **Table:** `events(id, org_id, event_key, payload, processed_at)`
- **Consumers:**
  - n8n workflows (via polling or webhooks)
  - Outbound webhook dispatcher
- **Ordering:** Guaranteed per org_id

### Observability
- **Analytics:** PostHog for product analytics
- **Tracing:** OpenTelemetry for distributed tracing
- **Metrics:** Per-org status dashboards
- **Audit Logs:** All mutations logged with user, timestamp, changes

## 8. Core Modules

### 8.1 Agency Master Dashboard
- **Metrics:** Totals and per-unit breakdown
  - Clients (active, churned, new)
  - Leads (by source, by org)
  - MRR (Monthly Recurring Revenue)
  - ARPA (Average Revenue Per Account)
  - Churn rate
  - Margin (revenue - costs)
  - Automation coverage %
  - SLA compliance %
- **Org Switcher:** Lists only permitted subaccounts based on user role
- **Filters:** Date range, org selection, metric drill-down

### 8.2 Unified Intake
- **Purpose:** Normalize inbound leads across all sources
- **Routing:** Routes to correct GHL pipeline by org
- **SLA Timers:** Tracks time to first response
- **Sources:**
  - Web forms
  - Email parsing
  - Phone calls (transcribed)
  - Chat widgets
  - Paid ads
- **Normalization:** Standardizes fields (name, email, phone, source, etc.)

### 8.3 Onboarding
- **Scaffold:** Google Drive/Sheets folder structure per client
- **Comms:** Auto-create Slack channel (SitePanda/DU) or Discord channel (LI)
- **GHL:** Create subaccount in GoHighLevel
- **SOP:** Checklist with tasks assigned to team
- **Timeline:** Target <3 days to complete onboarding

### 8.4 Fulfillment & QA
- **View:** Kanban board per org
- **QA Gates:** Required approvals before moving to next stage
- **Evidence:** Screenshots, videos, documents stored in org bucket
- **Stages:** Intake → In Progress → QA → Approved → Delivered

### 8.5 LI Site Audit Tool
- **Trigger:** One-click crawl from dashboard
- **Checks:** 50+ technical SEO checks
- **Data Sources:**
  - DataForSEO API (rankings, backlinks)
  - Custom crawler (on-page analysis)
- **Output:** Prioritized fixes with effort/impact matrix
- **Integration:** Auto-creates tasks in LI project board

### 8.6 SitePanda 3‑Click Site Builder
- **Step 1:** Input keywords + city/state
- **Step 2:** Select template from library
- **Step 3:** Build & publish via Duda API
- **Auto-features:**
  - Schema markup (LocalBusiness, Service, etc.)
  - Internal linking structure
  - XML sitemap generation
  - Google Search Console indexing monitor
- **Timeline:** <30 minutes from input to live site

### 8.7 DU GMB System
- **Workflow:**
  1. Create GMB listing
  2. Verify (or reinstate if suspended)
  3. Post cadence (weekly posts)
  4. CTR operations (click-through rate optimization)
  5. Review management
- **Suspension Monitor:** Alerts when listing status changes
- **Playbooks:** Step-by-step guides for reinstatement

### 8.8 Reporting & KPIs
- **Dashboards:** Per-org real-time dashboards
- **Weekly PDF:** Auto-generated report with key metrics
- **Delivery:** Via Slack (SitePanda, DU) or Discord (LI)
- **Metrics:**
  - Traffic (GA4)
  - Rankings (DataForSEO)
  - Leads (GHL)
  - Revenue (Stripe)

### 8.9 Billing & Profitability
- **Payment:** Stripe per org
- **Cost Model:**
  - Automation runtime costs (n8n, APIs)
  - Labor costs (time tracking)
  - Infrastructure costs (servers, SaaS)
- **Margin Calculation:** Revenue - Costs per client
- **Alerts:** Invoice delinquent after 7 days

### 8.10 R&D Lab & Asset Registry
- **Experiments:** A/B tests with KPI gates
- **Assets:**
  - Versioned prompts (OpenAI)
  - n8n workflows (exported JSON)
  - Templates (Duda, email, etc.)
- **Governance:** Approval required to promote to production
- **Rollback:** Easy revert to previous version

## 9. Data Model

### Core Tables

#### Organizations
```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- 'li', 'sitepanda', 'du'
  type TEXT NOT NULL, -- 'subaccount' or 'agency'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Organization Domains
```sql
CREATE TABLE org_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  domain TEXT UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Organization Secrets (KMS-encrypted)
```sql
CREATE TABLE org_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  provider TEXT NOT NULL, -- 'openai', 'dataforseo', 'stripe', etc.
  key_ref TEXT NOT NULL, -- Reference name for the key
  meta JSONB, -- Additional metadata
  rotated_at TIMESTAMPTZ,
  enc_blob TEXT NOT NULL, -- KMS-encrypted secret
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider, key_ref)
);
```

#### Webhook Endpoints
```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  event_key TEXT NOT NULL, -- 'lead.created', 'site.built', etc.
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- HMAC signing secret
  active BOOLEAN DEFAULT TRUE,
  last_status INTEGER, -- HTTP status code
  retry_count INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Role Bindings
```sql
CREATE TABLE role_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL, -- 'admin', 'super_admin', etc.
  scope_type TEXT NOT NULL, -- 'org', 'agency'
  scope_ids UUID[] NOT NULL, -- Array of org_ids user has access to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, scope_type)
);
```

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### User Organization Roles
```sql
CREATE TABLE user_organization_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  org_id UUID REFERENCES orgs(id),
  role TEXT NOT NULL, -- 'admin', 'manager', 'user'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);
```

### Existing Tables (to be created)
- `accounts` - Clients/customers
- `projects` - Work items per client
- `tasks` - Individual tasks within projects
- `audits` - Site audit results (LI)
- `sites` - Built sites (SitePanda)
- `gmb_listings` - GMB locations (DU)
- `metrics_daily` - Daily rollup of KPIs
- `billing` - Invoices and payments
- `events` - Event outbox for webhooks
- `assets` - Reusable templates, prompts, workflows
- `sops` - Standard Operating Procedures
- `runs` - Automation execution logs
- `integrations` - OAuth tokens and integration status

## 10. Integrations

### LI (Logic Inbound)
- Discord (comms)
- GHL v2 (CRM)
- GA4 (analytics)
- Google Sheets/Drive (docs)
- Stripe (billing)
- OpenAI (AI features)
- DataForSEO (SEO data)

### SitePanda
- Slack (comms)
- Duda API (site builder)
- GHL v2 (CRM)
- GA4 (analytics)
- Google Sheets/Drive (docs)
- Stripe (billing)
- OpenAI (AI features)
- DataForSEO (SEO data)

### DU (Decisions Unlimited)
- Slack (comms)
- GMB/Business Profile APIs (listings)
- GHL v2 (CRM)
- GA4 (analytics)
- Google Sheets/Drive (docs)
- Stripe (billing)
- OpenAI (AI features)
- DataForSEO (SEO data)

## 11. Automations (n8n)

### Workflow Definitions

#### Intake Webhook
- **Trigger:** POST to `/wh/{org}/intake/lead`
- **Steps:**
  1. Detect org from domain/path
  2. Normalize lead data
  3. Create lead in GHL
  4. Send notification to Slack/Discord
  5. Start SLA timer

#### Onboarding
- **Trigger:** Manual or API call
- **Steps:**
  1. Create Google Drive folder structure
  2. Create Slack channel or Discord channel (based on org)
  3. Create GHL subaccount
  4. Generate SOP checklist
  5. Assign tasks to team
  6. Send welcome message

#### Site Audit (LI only)
- **Trigger:** Button click in dashboard
- **Steps:**
  1. Crawl site with custom crawler
  2. Fetch DataForSEO data (rankings, backlinks)
  3. Run 50+ checks
  4. Generate prioritized fix list
  5. Create tasks in LI project board
  6. Send report to Discord

#### SitePanda Site Build
- **Trigger:** 3-click builder submission
- **Steps:**
  1. Generate content with OpenAI
  2. Build site via Duda API
  3. Add schema markup
  4. Generate sitemap
  5. Submit to Google Search Console
  6. Monitor indexing status
  7. Send completion notification to Slack

#### DU GMB Management
- **Trigger:** Scheduled (weekly for posts) or manual
- **Steps:**
  1. Check GMB status
  2. Create/verify listing if needed
  3. Generate post content with OpenAI
  4. Publish post via GMB API
  5. Monitor CTR
  6. Send status update to Slack

#### Weekly Reporting
- **Trigger:** Cron (every Monday 9am)
- **Steps:**
  1. Fetch GA4 data
  2. Fetch GHL pipeline data
  3. Fetch Stripe revenue data
  4. Compile into PDF report
  5. Send to Slack/Discord per org

#### Billing Update
- **Trigger:** Stripe webhook or scheduled
- **Steps:**
  1. Fetch Stripe data per org
  2. Calculate MRR and margin
  3. Update `metrics_daily` table
  4. Rollup to agency dashboard
  5. Alert on delinquent invoices

#### Outbound Webhook Dispatcher
- **Trigger:** New event in `events` table
- **Steps:**
  1. Find matching `webhook_endpoints` by org_id and event_key
  2. Sign payload with HMAC
  3. POST to endpoint URL
  4. Retry on failure with exponential backoff
  5. Move to DLQ after 6 failures
  6. Update `last_status` and `last_delivery_at`

## 12. Security & Compliance

### Tenant Isolation
- **Database:** RLS policies filter all queries by `org_id`
- **API:** Middleware validates user has access to requested org
- **Files:** Separate S3 buckets or prefixes per org
- **Webhooks:** Signed with org-specific secrets

### Encryption
- **Secrets:** KMS-encrypted `enc_blob` in `org_secrets`
- **Transit:** HTTPS/TLS for all external communication
- **At Rest:** Database encryption enabled

### Webhook Security
- **Inbound:** Verify signatures from external services (Stripe, GHL, etc.)
- **Outbound:** Sign with HMAC-SHA256 using endpoint secret
- **Headers:** Include timestamp to prevent replay attacks

### Audit Trails
- **Auth Events:** Login, logout, token refresh
- **Role Changes:** Grant/revoke access
- **Automation Runs:** Start, end, success/failure
- **Webhook Deliveries:** Sent, failed, retried
- **Data Mutations:** Create, update, delete with user and timestamp

### Compliance
- **GDPR:** Data export and deletion on request
- **SOC 2:** Audit logs, access controls, encryption
- **PCI:** Stripe handles all payment data (no card storage)

## 13. SLOs (Service Level Objectives)

### Automation Reliability
- **Target:** >99.9% success rate
- **Alerting:** <5 minutes for critical failures
- **Monitoring:** Per-workflow success rate dashboard

### Onboarding Speed
- **Target:** <3 days from signup to first value
- **Measurement:** Time from account creation to first project delivered

### Reporting Performance
- **Target:** <15 minutes for 95% of reports
- **Measurement:** Time from trigger to PDF delivery

### API Latency
- **Target:** p95 <500ms for read operations
- **Target:** p95 <2s for write operations
- **Monitoring:** OpenTelemetry traces

### Uptime
- **Target:** 99.9% uptime (excluding planned maintenance)
- **Monitoring:** External uptime monitor (UptimeRobot, etc.)

## 14. Rollout Plan

### Phase 1: Foundation (Weeks 1-4)
- [ ] Domain routing and org resolution middleware
- [ ] RBAC implementation with role bindings
- [ ] Secrets vault with KMS encryption
- [ ] Webhook registry tables and inbound handlers
- [ ] Agency master dashboard with org switcher
- [ ] Authentication flow (login, refresh, logout)

### Phase 2: Subaccount Cores (Weeks 5-8)
- [ ] Per-org dashboards
- [ ] Unified intake module
- [ ] Onboarding workflow
- [ ] Fulfillment & QA Kanban
- [ ] Discord integration (LI)
- [ ] Slack integration (SitePanda, DU)

### Phase 3: LI & SitePanda Unique Features (Weeks 9-12)
- [ ] LI Site Audit Tool
  - [ ] Custom crawler
  - [ ] DataForSEO integration
  - [ ] 50+ check library
  - [ ] Task creation
- [ ] SitePanda 3-Click Builder
  - [ ] Duda API integration
  - [ ] Template library
  - [ ] Schema markup generation
  - [ ] Indexing monitor

### Phase 4: DU & Reporting (Weeks 13-16)
- [ ] DU GMB System
  - [ ] GMB API integration
  - [ ] Verification workflow
  - [ ] Post cadence automation
  - [ ] Suspension monitor
- [ ] Reporting & KPIs
  - [ ] GA4 integration
  - [ ] PDF generation
  - [ ] Slack/Discord delivery
- [ ] Billing & Profitability
  - [ ] Stripe integration
  - [ ] Cost tracking
  - [ ] Margin calculation
- [ ] Outbound webhook dispatcher

### Phase 5: Advanced Features (Weeks 17-20)
- [ ] R&D Lab
  - [ ] Experiment framework
  - [ ] KPI gates
  - [ ] Approval workflow
- [ ] Asset Registry
  - [ ] Versioned prompts
  - [ ] Workflow templates
  - [ ] Rollback capability
- [ ] Cross-org analytics
  - [ ] Comparative metrics
  - [ ] Benchmarking
  - [ ] Trend analysis

## 15. Technical Debt & Known Issues

### Current Issues (as of Oct 2025)
1. **Domain Mismatch:** Database has `ducrm.com` and `sitepandaseo.com` but spec calls for `my.decisionsunlimited.io` and `my.sitepanda.com`
   - **Action:** Migration script needed to update `org_domains` table

2. **Tailwind Utility Classes Not Generated:** PostCSS config was missing, causing layout issues
   - **Fix:** Added `postcss.config.js` with Tailwind plugin
   - **Prevention:** Include in project scaffold

3. **Backend Rate Limiter Issues:** Express not trusting proxy headers from Nginx
   - **Fix:** Added `app.set('trust proxy', true)` to `server.js`
   - **Prevention:** Document in deployment guide

4. **Frontend API Proxy:** `NEXT_PUBLIC_API_URL` environment variable required for API calls to work
   - **Fix:** Added to `.env` file
   - **Prevention:** Include in Docker Compose env vars

### Future Improvements
- [ ] Implement Redis caching for frequently accessed data
- [ ] Add GraphQL layer for complex queries
- [ ] Migrate to Supabase Edge Functions for real-time features
- [ ] Implement WebSocket for live dashboard updates
- [ ] Add end-to-end tests with Playwright
- [ ] Set up CI/CD pipeline with GitHub Actions

## 16. Deployment & Operations

### Production Environment
- **Server:** 104.225.223.44
- **OS:** Ubuntu 22.04
- **Orchestration:** Docker Compose
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (auto-renewal)

### Container Architecture
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://...
      - JWT_SECRET=...
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=unified_ops
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
```

### Deployment Process
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed procedures.

### Monitoring & Alerts
- **Logs:** Docker logs aggregated to CloudWatch/Datadog
- **Metrics:** Prometheus + Grafana dashboards
- **Alerts:** PagerDuty for critical issues
- **Uptime:** External monitoring with 1-minute checks

## Outcome

Three isolated subaccounts with:
- ✅ Provider-specific communications (Discord for LI, Slack for SitePanda/DU)
- ✅ Org-scoped OpenAI and DataForSEO keys
- ✅ Full webhook ingress/egress with HMAC signing
- ✅ Strict tenant isolation via RLS
- ✅ Agency layer with unified visibility and control
- ✅ Scalable automation framework with n8n
- ✅ Comprehensive audit trails and observability

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Maintainer:** Kyle Roelofs  
**Repository:** https://github.com/steadycalls/unified-ops-platform

