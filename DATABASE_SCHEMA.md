# Unified Ops — Database Schema (Postgres)

**Multi-tenant architecture.** Agency → Subaccount (org). Domain‑scoped auth. RBAC. Webhooks in/out. Provider keys per org. Slack (SitePanda/DU), Discord (LI). Duda for SitePanda. GA4, GHL, Stripe per org.

## Conventions

- **ID Type:** ULID/UUID v7 for all primary keys
- **Timestamps:** `created_at`, `updated_at` (default `now()`)
- **Soft Delete:** `deleted_at` where needed
- **Tenant Isolation:** `org_id` present on all tenant data tables
- **RLS:** Row-Level Security uses `current_setting('app.org_id')` set by API middleware
- **Enum Types:** `role_enum`, `org_type_enum`, `event_key_enum`, `task_status_enum`, `project_stage_enum`

## Enums

```sql
CREATE TYPE role_enum AS ENUM (
  'user',
  'manager',
  'admin',
  'super_user',
  'super_manager',
  'super_admin'
);

CREATE TYPE org_type_enum AS ENUM (
  'agency',
  'li',
  'sitepanda',
  'du'
);

CREATE TYPE event_key_enum AS ENUM (
  'lead.created',
  'project.created',
  'task.updated',
  'audit.completed',
  'site.built',
  'gmb.status_changed',
  'report.ready',
  'invoice.delinquent'
);

CREATE TYPE task_status_enum AS ENUM (
  'todo',
  'in_progress',
  'blocked',
  'qa',
  'done',
  'canceled'
);

CREATE TYPE project_stage_enum AS ENUM (
  'intake',
  'onboarding',
  'active',
  'qa',
  'reporting',
  'complete',
  'paused'
);
```

## Identity & Organization

### users
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email citext UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** User accounts across all orgs. Email is case-insensitive (`citext`).

**Notes:**
- Password hash stored in Supabase Auth, not here
- `display_name` used in UI instead of email
- `avatar_url` for profile pictures

---

### orgs
```sql
CREATE TABLE orgs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  type org_type_enum NOT NULL, -- 'li' | 'sitepanda' | 'du' | 'agency'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Organizations (subaccounts + agency parent).

**Types:**
- `agency` - Master agency account
- `li` - Logic Inbound subaccount
- `sitepanda` - SitePanda subaccount
- `du` - Decisions Unlimited subaccount

---

### org_domains
```sql
CREATE TABLE org_domains (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE, -- e.g., 'my.logicinbound.com'
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Maps domains to orgs for routing middleware.

**Example Data:**
```sql
INSERT INTO org_domains (org_id, domain, is_primary) VALUES
  ('li-uuid', 'my.logicinbound.com', true),
  ('sitepanda-uuid', 'my.sitepanda.com', true),
  ('du-uuid', 'my.decisionsunlimited.io', true);
```

---

### role_bindings
```sql
CREATE TABLE role_bindings (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role role_enum NOT NULL,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE, -- null for agency‑wide? prefer explicit per org
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);
```

**Purpose:** RBAC bindings. User can have different roles in different orgs.

**Notes:**
- `org_id` should always be set (prefer explicit bindings)
- Super admins have bindings to all 3 subaccounts
- One binding per user per org

**Example:**
```sql
-- Super admin with access to all orgs
INSERT INTO role_bindings (user_id, role, org_id) VALUES
  ('admin-user-uuid', 'super_admin', 'li-uuid'),
  ('admin-user-uuid', 'super_admin', 'sitepanda-uuid'),
  ('admin-user-uuid', 'super_admin', 'du-uuid');

-- Regular user with access to one org
INSERT INTO role_bindings (user_id, role, org_id) VALUES
  ('user-uuid', 'user', 'li-uuid');
```

## Integrations & Secrets

### integrations
```sql
CREATE TABLE integrations (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  vendor text NOT NULL, -- 'ghl','stripe','ga4','google','slack','discord','duda','dataforseo','openai'
  scopes text[],
  status text, -- 'ok','error','pending'
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, vendor)
);
```

**Purpose:** Tracks integration status and OAuth scopes per org.

**Vendors:**
- `ghl` - GoHighLevel CRM
- `stripe` - Payment processing
- `ga4` - Google Analytics 4
- `google` - Google Drive/Sheets
- `slack` - Slack workspace (SitePanda, DU)
- `discord` - Discord server (LI)
- `duda` - Duda site builder (SitePanda only)
- `dataforseo` - SEO data API
- `openai` - OpenAI API

**Status Values:**
- `ok` - Integration healthy
- `error` - Connection failed
- `pending` - OAuth flow in progress

**Meta JSONB Examples:**
```json
{
  "channel_map": {
    "alerts": "#alerts",
    "reports": "#weekly-reports"
  },
  "workspace_id": "T1234567890",
  "last_health_check": "2025-10-18T12:00:00Z"
}
```

---

### org_secrets
```sql
CREATE TABLE org_secrets (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'openai','dataforseo','slack','discord','duda','ghl','stripe','ga4','google'
  key_ref text NOT NULL,
  enc_blob bytea NOT NULL,
  meta jsonb,
  rotated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, provider)
);
```

**Purpose:** KMS-encrypted secrets per org. **Never exposed to frontend.**

**Fields:**
- `provider` - Which service the secret is for
- `key_ref` - Reference name for rotation tracking
- `enc_blob` - KMS-encrypted secret (bytea)
- `meta` - Additional metadata (e.g., key version, rotation schedule)
- `rotated_at` - Last rotation timestamp

**Security:**
- Backend decrypts `enc_blob` using KMS
- Secrets never sent to frontend
- Alert when `rotated_at` > 90 days old

## Webhooks (Inbound/Outbound)

### webhook_endpoints
```sql
CREATE TABLE webhook_endpoints (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  event_key event_key_enum NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  active boolean DEFAULT true,
  last_status integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, event_key, url)
);
```

**Purpose:** Outbound webhook destinations registry.

**Fields:**
- `event_key` - Which events to send (e.g., `lead.created`)
- `url` - Destination endpoint
- `secret` - HMAC signing secret
- `active` - Enable/disable endpoint
- `last_status` - Last HTTP status code received

---

### webhook_deliveries
```sql
CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_key event_key_enum NOT NULL,
  payload jsonb NOT NULL,
  attempt int NOT NULL DEFAULT 1,
  status_code int,
  error text,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Append-only log of outbound webhook deliveries.

**Retry Logic:**
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s
- Max 6 attempts
- Move to DLQ (Dead Letter Queue) after final failure

---

### webhook_inbound
```sql
CREATE TABLE webhook_inbound (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source text NOT NULL, -- 'stripe','ghl','ga4','slack','discord','crawler','gmb'
  signature_valid boolean,
  event_key text,
  payload jsonb NOT NULL,
  received_at timestamptz DEFAULT now()
);
```

**Purpose:** Inbound webhook receipts from external services.

**Sources:**
- `stripe` - Payment events
- `ghl` - GoHighLevel pipeline updates
- `ga4` - Google Analytics events
- `slack` - Slash commands, interactive actions
- `discord` - Bot commands, events
- `crawler` - Site audit completion
- `gmb` - Google My Business status changes

## Accounts, Projects, Tasks, SOPs

### accounts
```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier text,
  owner_id uuid REFERENCES users(id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, name)
);
```

**Purpose:** Clients/customers per org.

**Fields:**
- `tier` - Service tier (e.g., 'basic', 'premium', 'enterprise')
- `owner_id` - Account manager/owner
- `status` - 'active', 'churned', 'paused'

---

### contacts
```sql
CREATE TABLE contacts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email citext,
  name text,
  role text,
  phone text,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Contact persons for each account.

---

### projects
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  service text NOT NULL, -- 'seo','ppc','web','gmb','r&d'
  stage project_stage_enum NOT NULL DEFAULT 'intake',
  sla_due_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Work items per client.

**Services:**
- `seo` - SEO services
- `ppc` - Paid advertising
- `web` - Website development
- `gmb` - Google My Business management
- `r&d` - Research & development

**Stages:**
- `intake` → `onboarding` → `active` → `qa` → `reporting` → `complete`
- `paused` - Temporarily on hold

---

### sops
```sql
CREATE TABLE sops (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  version text NOT NULL,
  min_checks_pass int DEFAULT 0,
  doc_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, name, version)
);
```

**Purpose:** Standard Operating Procedures with versioning.

**Fields:**
- `version` - SOP version (e.g., 'v1.0', 'v2.1')
- `min_checks_pass` - Minimum QA checks required
- `doc_url` - Link to full documentation

---

### tasks
```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sop_id uuid REFERENCES sops(id),
  assignee_id uuid REFERENCES users(id),
  title text NOT NULL,
  status task_status_enum NOT NULL DEFAULT 'todo',
  eta timestamptz,
  run_id uuid, -- last automation run
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX org_proj_idx ON tasks(org_id, project_id);
```

**Purpose:** Individual tasks within projects.

**Statuses:**
- `todo` → `in_progress` → `qa` → `done`
- `blocked` - Waiting on external dependency
- `canceled` - No longer needed

## Automation Runs, Events, Audit Log

### runs
```sql
CREATE TABLE runs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  flow_key text NOT NULL, -- e.g., '/seo/audit','/sitepanda/build','/du/gmb'
  status text NOT NULL, -- 'queued','running','success','failed'
  artifact_url text,
  log_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Automation execution logs (n8n workflows).

**Flow Keys:**
- `/seo/audit` - LI site audit
- `/sitepanda/build` - SitePanda 3-click builder
- `/du/gmb` - DU GMB operations
- `/report/weekly` - Weekly report generation
- `/onboarding/create` - New client onboarding

---

### events
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  state text NOT NULL DEFAULT 'pending', -- 'pending','dispatched','dead'
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Event outbox for webhook dispatcher and n8n.

**States:**
- `pending` - Not yet processed
- `dispatched` - Successfully sent
- `dead` - Failed after retries (DLQ)

---

### audit_logs
```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Full audit trail of all mutations.

**Actions:**
- `create`, `update`, `delete`
- `login`, `logout`, `token_refresh`
- `role_grant`, `role_revoke`
- `secret_rotate`

**Entities:**
- `user`, `account`, `project`, `task`, `integration`, `webhook_endpoint`

## Metrics, Reporting, Billing

### metrics_daily
```sql
CREATE TABLE metrics_daily (
  date date NOT NULL,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  metric_key text NOT NULL, -- 'sessions','leads','calls','rank_delta','ctr','reviews','sites_built','audits_done','mrr','margin'
  value numeric NOT NULL,
  PRIMARY KEY (date, org_id, account_id, metric_key)
);
```

**Purpose:** Daily rollup of KPIs per account.

**Metric Keys:**
- `sessions` - GA4 sessions
- `leads` - New leads
- `calls` - Phone calls
- `rank_delta` - Ranking change
- `ctr` - Click-through rate
- `reviews` - New reviews
- `sites_built` - Sites published
- `audits_done` - Audits completed
- `mrr` - Monthly Recurring Revenue
- `margin` - Profit margin

**Optimization:**
- Partition by month for fast queries
- Materialized view for agency dashboard: `mv_agency_kpis`

---

### reports
```sql
CREATE TABLE reports (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'weekly','monthly','exec'
  period_start date NOT NULL,
  period_end date NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Generated reports (PDFs stored in S3).

**Types:**
- `weekly` - Weekly client report
- `monthly` - Monthly summary
- `exec` - Executive summary for agency

---

### billing
```sql
CREATE TABLE billing (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_sub_id text,
  mrr numeric,
  status text, -- 'active','past_due','canceled'
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Billing status and Stripe integration.

**Statuses:**
- `active` - Subscription active
- `past_due` - Payment failed
- `canceled` - Subscription canceled

## LI — Site Audit Tool

### audits
```sql
CREATE TABLE audits (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  site_url text NOT NULL,
  score numeric CHECK (score BETWEEN 0 AND 100),
  findings jsonb NOT NULL, -- structured list of issues
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Site audit results for LI clients.

**Fields:**
- `score` - Overall SEO score (0-100)
- `findings` - JSONB array of issues with priority, effort, impact

**Findings JSONB Example:**
```json
{
  "issues": [
    {
      "key": "schema.missing",
      "severity": "high",
      "pages": 15,
      "effort": "low",
      "impact": "high",
      "description": "Missing LocalBusiness schema markup"
    }
  ]
}
```

---

### audit_issues
```sql
CREATE TABLE audit_issues (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  issue_key text NOT NULL, -- e.g., 'schema.missing','title.too_long'
  severity text NOT NULL, -- 'low','med','high'
  pages int,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Normalized issue table for querying and reporting.

## SitePanda — 3‑Click Site Builder

### sites
```sql
CREATE TABLE sites (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  domain text NOT NULL,
  template_id text NOT NULL,
  status text NOT NULL, -- 'building','live','error'
  indexed boolean DEFAULT false,
  build_run_id uuid REFERENCES runs(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, domain)
);
```

**Purpose:** Sites built via SitePanda 3-click builder.

**Statuses:**
- `building` - In progress
- `live` - Published and accessible
- `error` - Build failed

**Fields:**
- `indexed` - Submitted to Google Search Console
- `build_run_id` - Reference to automation run

---

### site_pages
```sql
CREATE TABLE site_pages (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  path text NOT NULL,
  title text,
  published boolean DEFAULT false,
  schema jsonb,
  interlinks jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(site_id, path)
);
```

**Purpose:** Individual pages within a site.

**Fields:**
- `schema` - JSON-LD schema markup
- `interlinks` - Internal linking structure

## DU — GMB System

### gmblistings
```sql
CREATE TABLE gmblistings (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text,
  place_id text,
  status text NOT NULL, -- 'pending','verified','suspended','reinstated'
  ctr_rate numeric,
  reviews_count int,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Google My Business listings for DU clients.

**Statuses:**
- `pending` - Awaiting verification
- `verified` - Active and verified
- `suspended` - Suspended by Google
- `reinstated` - Reinstated after suspension

---

### gmb_posts
```sql
CREATE TABLE gmb_posts (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  gmb_id uuid NOT NULL REFERENCES gmblistings(id) ON DELETE CASCADE,
  kind text, -- 'update','offer','event'
  title text,
  body text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Posts published to GMB listings.

**Kinds:**
- `update` - General update
- `offer` - Special offer/promotion
- `event` - Event announcement

## Indexing & Row-Level Security

### Common Indexes
```sql
CREATE INDEX idx_accounts_org ON accounts(org_id);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_tasks_org_status ON tasks(org_id, status);
CREATE INDEX idx_runs_org_flow ON runs(org_id, flow_key);
CREATE INDEX idx_metrics_org_key ON metrics_daily(org_id, metric_key, date);
CREATE INDEX idx_reports_org_period ON reports(org_id, period_start, period_end);
```

### Row-Level Security (RLS)

**Enable RLS on all tenant tables:**
```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables with org_id
```

**Example Policy:**
```sql
CREATE POLICY org_isolation_accounts ON accounts
USING (org_id::text = current_setting('app.org_id'));
```

**API Middleware Sets Context:**
```javascript
// In Express middleware after domain resolution
await db.query("SET app.org_id = $1", [orgId]);
```

## Optimization Notes

### Partitioning
- **metrics_daily:** Partition by month for fast rollups
  ```sql
  CREATE TABLE metrics_daily_2025_10 PARTITION OF metrics_daily
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
  ```

### Materialized Views
- **Agency Dashboard:** `mv_agency_kpis` for cross-org aggregates
  ```sql
  CREATE MATERIALIZED VIEW mv_agency_kpis AS
  SELECT 
    org_id,
    SUM(CASE WHEN metric_key = 'mrr' THEN value ELSE 0 END) as total_mrr,
    SUM(CASE WHEN metric_key = 'leads' THEN value ELSE 0 END) as total_leads
  FROM metrics_daily
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY org_id;
  
  REFRESH MATERIALIZED VIEW mv_agency_kpis;
  ```

### Object Storage
- **Artifacts:** Store in S3 with org_id-scoped prefixes
  - `s3://unified-ops/li/audits/{audit_id}/report.pdf`
  - `s3://unified-ops/sitepanda/sites/{site_id}/screenshots/`

### Background Jobs
- **Webhook Retries:** Redis-backed job queue
- **Report Rendering:** Async PDF generation
- **Health Checks:** Periodic integration status pings

## Security Checklist

- [x] RLS enabled on all tenant tables
- [x] `org_id` in all tenant data
- [x] KMS encryption for `org_secrets.enc_blob`
- [x] HMAC signing for outbound webhooks
- [x] Signature validation for inbound webhooks
- [x] Audit logs for all mutations
- [x] Unique constraints prevent duplicate data
- [x] Foreign keys with CASCADE for cleanup
- [x] Indexes on all query patterns

---

**Result:** Minimal, strict, tenant‑safe schema with room for scale and per‑org integrations.

**See Also:** [APP_SPEC.md](./APP_SPEC.md) for full application specification.

