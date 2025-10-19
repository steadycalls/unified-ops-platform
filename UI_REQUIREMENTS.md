# Unified Ops — UI Requirements (Wireframe Spec)

**Goal:** Specify pages, routes, states, and interactions. Leave styling to implementation. All buttons and links must resolve to a route or action. RBAC applies per role. Domain-aware routing per subaccount.

## 0. Global UI Patterns

### Domains
- **LI:** `my.logicinbound.com`
- **DU:** `my.decisionsunlimited.io`
- **SitePanda:** `my.sitepanda.com`
- **Agency:** `agency.unifiedops.app`

### Top Navigation (Subaccount)
- **Logo** - Organization branding
- **Account Switcher** - Lists permitted orgs
  - Clicking switches hostname and preserves route path when available
  - Route fallback to `/dashboard` if path missing in target org
- **Search** - Global search across entities
- **Notifications** - Bell icon with badge count
- **User Menu** - Avatar dropdown with profile, settings, logout

### RBAC Behavior
- **Hide actions** user cannot perform
- **Tooltips** explain missing permissions
- **Graceful degradation** - Show read-only view if no edit permission

### Feedback Patterns
- **Success/Error Toasts** - Non-blocking notifications
- **Modal Confirms** - For destructive actions (delete, revoke, etc.)
- **Loading States** - Spinners, skeleton screens, progress bars

### Table Features (Standard)
- **Pagination** - 10/25/50/100 per page
- **Sort** - Click column headers
- **Filter** - Per-column or global search
- **Column Visibility** - Show/hide columns
- **CSV Export** - Download current view

---

## 1. Auth & Org Select

### Route: `/auth/login` (per domain)

**Fields:**
- Email (required)
- Password (required)
- SSO button (if configured for org)

**Buttons:**
- **[Log in]** → `POST /api/auth/login`
  - Success: Redirect to `/dashboard`
  - Error: Show toast with error message
- **[Forgot password]** → `/auth/reset`

**Post-Login Flow:**
1. Resolve org from domain (`org_domains` table)
2. Validate user has role binding for org
3. Set JWT with `org_id` and `role`
4. Redirect to `/dashboard`

---

## 2. Dashboard (Subaccount)

### Route: `/dashboard`

**Widgets:**
- **KPI Tiles:**
  - Clients (active count, trend)
  - Leads (this month, trend)
  - MRR (Monthly Recurring Revenue)
  - Margin (profit %)
  - Automation Coverage %
  - SLA Compliance %
- **Trends Chart** - Last 30 days
- **Recent Activity** - Last 10 events
- **Failed Runs** - Count with link
- **Upcoming SLAs** - Due in next 7 days

**Buttons:**
- **[View Accounts]** → `/accounts`
- **[View Projects]** → `/projects`
- **[Failed Runs]** → `/runs?status=failed`
- **[Weekly Report]** → `/reports?type=weekly`

**RBAC:**
- `user` - View only
- `manager` - View + create projects
- `admin` - Full access

---

## 3. Agency Dashboard

### Domain: `agency.unifiedops.app`
### Route: `/dashboard`

**Widgets:**
- **Per-Org KPI Tiles:**
  - LI: Clients, Leads, MRR, Audits Run
  - SitePanda: Clients, Leads, MRR, Sites Built
  - DU: Clients, Leads, MRR, GMB Listings
- **Compare Chart** - Side-by-side org comparison
- **Rollups:**
  - Total MRR across all orgs
  - Total Margin
  - Total Automation Coverage
- **Warnings:**
  - Failed runs count
  - Delinquent invoices
  - Integration errors

**Buttons:**
- **[Open LI]** → `https://my.logicinbound.com/dashboard`
- **[Open SitePanda]** → `https://my.sitepanda.com/dashboard`
- **[Open DU]** → `https://my.decisionsunlimited.io/dashboard`
- **[Export]** → `/exports/agency-kpis.csv`

**RBAC:**
- Only `super_admin`, `super_manager`, `super_user` can access
- Regular users see 403 if they try to access

---

## 4. Accounts

### Route: `/accounts`

**Table Columns:**
- Name
- Owner (user)
- Tier (basic/premium/enterprise)
- Status (active/churned/paused)
- MRR
- Last Activity (date)

**Buttons:**
- **[New Account]** → `/accounts/new`
- **Row [Open]** → `/accounts/:id`
- **Row [Projects]** → `/projects?account=:id`

### Route: `/accounts/new` | `/accounts/:id/edit`

**Fields:**
- Name (required)
- Tier (dropdown: basic, premium, enterprise)
- Owner (user dropdown)
- Notes (textarea)

**Buttons:**
- **[Save]** → `POST /api/accounts` or `PUT /api/accounts/:id`
  - Success: Redirect to `/accounts/:id`
  - Error: Show validation errors inline
- **[Cancel]** → `/accounts`

**RBAC:**
- `user` - View only
- `manager` - Create/edit
- `admin` - Full access including delete

---

## 5. Contacts

### Route: `/accounts/:id/contacts`

**Table Columns:**
- Name
- Email
- Role (primary contact, billing, technical, etc.)
- Phone

**Buttons:**
- **[Add Contact]** → `/accounts/:id/contacts/new`
- **Row [Edit]** → `/accounts/:id/contacts/:cid/edit`
- **Row [Delete]** → Confirm modal → `DELETE /api/contacts/:cid`

### Route: `/accounts/:id/contacts/new` | `/accounts/:id/contacts/:cid/edit`

**Fields:**
- Name (required)
- Email (required, validated)
- Role (dropdown)
- Phone (optional, formatted)

**Buttons:**
- **[Save]** → `POST /api/contacts` or `PUT /api/contacts/:cid`
- **[Cancel]** → `/accounts/:id/contacts`

---

## 6. Projects

### Route: `/projects`

**Views:**
- **Table View** (default)
- **Kanban View** - Grouped by stage

**Table Columns:**
- Account Name
- Service (SEO, PPC, Web, GMB, R&D)
- Stage (intake → onboarding → active → qa → reporting → complete)
- SLA Due (date, highlighted if <48h)
- Owner (user)

**Buttons:**
- **[New Project]** → `/projects/new`
- **[Kanban]** - Toggle view
- **Row [Open]** → `/projects/:id`

### Route: `/projects/:id`

**Tabs:**
- **Overview** - Project details, account info, timeline
- **Tasks** - Task list with status
- **QA** - QA checklist and evidence
- **Reports** - Generated reports for this project
- **Billing** - Invoice history

**Buttons:**
- **[Add Task]** → `/projects/:id/tasks/new`
- **[Run Automation]** → Modal to select flow
  - Options: `/seo/audit`, `/sitepanda/build`, `/du/gmb`, `/report/weekly`
  - Button: **[Run]** → `POST /api/runs`
- **[Move Stage]** → Dropdown to change stage
  - Confirm modal if moving backwards
  - Updates `projects.stage`

**RBAC:**
- `user` - View only
- `manager` - Create, edit, move stages
- `admin` - Full access including delete

---

## 7. Tasks

### Route: `/projects/:id/tasks`

**Table Columns:**
- Title
- Assignee (user)
- SOP (linked)
- Status (todo → in_progress → blocked → qa → done → canceled)
- ETA (date)

**Buttons:**
- **[Add Task]** → `/projects/:id/tasks/new`
- **Row [Open]** → `/tasks/:tid`
- **Row [Run]** → `POST /api/runs` (if task has automation)

### Route: `/tasks/:tid`

**Sections:**
- **Description** - Rich text
- **SOP Steps** - Checklist from linked SOP
- **Attachments** - Upload/download files
- **Run History** - Table of automation runs

**Buttons:**
- **[Start]** - Changes status to `in_progress`
- **[Submit for QA]** - Changes status to `qa`
- **[Mark Done]** - Changes status to `done`
- **[Trigger Flow]** → `POST /api/runs`
  - Modal to select flow and parameters

**RBAC:**
- `user` - Can update own tasks
- `manager` - Can update any task
- `admin` - Full access

---

## 8. SOPs (Standard Operating Procedures)

### Route: `/sops`

**Table Columns:**
- Name
- Category (onboarding, fulfillment, qa, reporting, etc.)
- Version (v1.0, v2.1, etc.)
- Min Checks (minimum QA checks required)
- Updated (date)

**Buttons:**
- **[New SOP]** → `/sops/new`
- **Row [Open]** → `/sops/:id`
- **Row [Promote to Default]** → `POST /api/sops/:id/promote`
  - Sets this version as default for category

### Route: `/sops/:id`

**Sections:**
- **Metadata** - Name, category, version, min checks
- **Steps** - Ordered checklist
- **Documentation** - Link to full doc (Google Doc, Notion, etc.)
- **Usage** - Tasks using this SOP

**Buttons:**
- **[Edit]** → `/sops/:id/edit`
- **[Clone]** → Creates new version
- **[Deprecate]** - Marks as inactive

**RBAC:**
- `user` - View only
- `manager` - Create, edit
- `admin` - Promote, deprecate

---

## 9. Runs (Automations)

### Route: `/runs`

**Table Columns:**
- Flow Key (e.g., `/seo/audit`, `/sitepanda/build`)
- Status (queued → running → success → failed)
- Started (timestamp)
- Ended (timestamp)
- Duration (calculated)
- Task Link (if associated with task)

**Filters:**
- Status (all, success, failed, running)
- Flow Key (dropdown)
- Date Range

**Buttons:**
- **[Retry Failed]** → `POST /api/runs/:id/retry`
- **Row [View Logs]** → `/runs/:id`

### Route: `/runs/:id`

**Sections:**
- **Metadata** - Flow key, status, timestamps
- **Artifacts** - Links to generated files (PDFs, CSVs, etc.)
- **Logs** - Structured logs from n8n
- **Error Details** - Stack trace if failed

**Buttons:**
- **[Retry]** → `POST /api/runs/:id/retry`
- **[Download Logs]** - Text file
- **[View in n8n]** - External link (if admin)

**RBAC:**
- `user` - View own runs
- `manager` - View all runs, retry
- `admin` - Full access

---

## 10. Reporting

### Route: `/reports`

**Filters:**
- Type (weekly, monthly, exec)
- Date Range
- Account (dropdown)

**Table Columns:**
- Type
- Period (start - end dates)
- Account
- Link (PDF URL)

**Buttons:**
- **[Generate Now]** → `POST /api/reports/generate`
  - Modal to select type, account, period
- **Row [Open PDF]** - Opens file in new tab
- **[Schedule Weekly]** → `/settings/schedules`

**RBAC:**
- `user` - View reports for assigned accounts
- `manager` - View all, generate
- `admin` - Full access

---

## 11. Metrics

### Route: `/metrics`

**Charts:**
- Sessions (GA4)
- Leads (by source)
- Rank Delta (DataForSEO)
- CTR (GMB)
- Reviews (GMB)
- Audits Completed (LI)
- Sites Built (SitePanda)
- MRR (Stripe)
- Margin (calculated)

**Filters:**
- Date Range (last 7/30/90 days, custom)
- Account (dropdown)
- Metric (multi-select)

**Buttons:**
- **[Export CSV]** → `/exports/metrics.csv`
- **[Add Widget]** - Modal to add custom chart

**RBAC:**
- All roles can view
- `admin` can configure widgets

---

## 12. Billing

### Route: `/billing`

**Cards:**
- **Subscription Status** - Active, past due, canceled
- **Invoices** - Table of recent invoices
- **MRR** - Current monthly recurring revenue
- **Dunning Alerts** - Overdue payments

**Buttons:**
- **[Open in Stripe]** - External link to Stripe dashboard
- **[Update Payment Method]** - Stripe Customer Portal link
- **Row [Download Invoice]** - PDF download

**RBAC:**
- `user` - No access
- `manager` - View only
- `admin` - Full access

---

## 13. Integrations (Per Subaccount)

### Route: `/settings/integrations`

**Sections:**

### Communications
- **LI:** Discord
  - Fields: Bot Token, Default Channel IDs
  - Buttons: **[Connect]**, **[Disconnect]**, **[Test Ping]**
- **SitePanda/DU:** Slack
  - Fields: Bot Token, Signing Secret, Default Channel IDs
  - Buttons: **[Connect]**, **[Disconnect]**, **[Test Ping]**

### GHL v2
- Fields: Access Token, Location IDs
- Buttons: **[Connect]**, **[Sync Pipelines]**

### Google
- Fields: GA4 Property ID, Drive/Sheets OAuth
- Buttons: **[Connect]**, **[Verify]**

### Stripe
- Fields: Secret Key, Webhook Secret
- Buttons: **[Connect]**, **[Open Dashboard]**

### OpenAI
- Fields: API Key
- Button: **[Save & Test]**

### DataForSEO
- Fields: Login, Password
- Button: **[Save & Test]**

### Duda (SitePanda Only)
- Fields: Client ID, Client Secret
- Button: **[Save & Test]**

**Status Indicators:**
- 🟢 Connected (last check <5 min ago)
- 🟡 Warning (last check >1 hour ago)
- 🔴 Error (connection failed)

**RBAC:**
- `user` - No access
- `manager` - View only
- `admin` - Full access

---

## 14. Secrets Vault

### Route: `/settings/secrets`

**Table Columns:**
- Provider (openai, dataforseo, slack, etc.)
- Last Rotated (date)
- Status (active, expired, revoked)

**Buttons:**
- **[Rotate]** → `POST /api/secrets/:id/rotate`
  - Generates new key, updates `rotated_at`
- **[Revoke]** → `POST /api/secrets/:id/revoke`
  - Confirm modal (destructive)

**Security:**
- Never show actual secret values
- Show only last 4 characters (e.g., `sk-...abc123`)
- Alert if `rotated_at` > 90 days

**RBAC:**
- Only `admin` can access

---

## 15. Webhooks

### Route: `/settings/webhooks`

**Tabs:**
- Outbound
- Inbound
- Logs

### Outbound Tab

**Table Columns:**
- Event Key (lead.created, site.built, etc.)
- URL
- Active (toggle)
- Last Status (HTTP code)

**Buttons:**
- **[Add Endpoint]** → `/settings/webhooks/outbound/new`
- **Row [Send Test]** → `POST /api/webhooks/test`
  - Sends sample payload
- **Row [Disable/Enable]** - Toggle `active` field

### Inbound Tab

**Table Columns:**
- Source (stripe, ghl, ga4, slack, discord, etc.)
- Endpoint Path (e.g., `/wh/li/intake/lead`)
- Last Received (timestamp)
- Signature Status (valid/invalid)

**Buttons:**
- **[View Docs]** → `/docs/webhooks`
- **[Copy Secret]** - Copies signing secret to clipboard
- **[Regenerate Secret]** - Confirm modal → new secret

### Logs Tab

**Table Columns:**
- Event Key
- Status Code
- Attempts (1-6)
- Timestamp
- Error (if failed)

**Filters:**
- Status (all, success, failed, retrying)
- Event Key
- Date Range

**Buttons:**
- **Row [Retry]** → `POST /api/webhooks/:deliveryId/retry`
- **[Export]** → CSV download

**RBAC:**
- `user` - No access
- `manager` - View logs
- `admin` - Full access

---

## 16. Onboarding Wizard

### Route: `/onboarding`

**Steps:**
1. **Company Info**
   - Fields: Company name, tier, owner
   - Button: **[Next]**

2. **Integrations**
   - Checkboxes: GHL, GA4, Stripe, Slack/Discord
   - Button: **[Next]**, **[Back]**

3. **Templates**
   - Select default SOP templates
   - Button: **[Next]**, **[Back]**

4. **Credentials**
   - API keys for selected integrations
   - Button: **[Next]**, **[Back]**

5. **Review**
   - Summary of all selections
   - Button: **[Finish]**, **[Back]**

**[Finish] Action:**
- Creates account in database
- Creates Google Drive folder structure
- Creates Slack channel (SitePanda/DU) or Discord channel (LI)
- Creates GHL subaccount
- Generates SOP checklist
- Redirects to `/accounts/:id`

**RBAC:**
- `manager` and `admin` can access

---

## 17. LI — Site Audit Tool

### Route: `/audit` (LI only)

**Form:**
- URL (required, validated)
- Crawl Depth (dropdown: 1-5)
- User Agent (dropdown: desktop, mobile, bot)
- Include Sitemap (checkbox)

**Buttons:**
- **[Run Audit]** → `POST /api/audit/run`
  - Creates `runs` entry with flow_key `/seo/audit`
  - Shows loading state
  - Redirects to `/audit/:auditId` when complete
- **[View History]** → `/audit/history`

### Route: `/audit/:auditId`

**Sections:**
- **Score** - Overall SEO score (0-100)
- **Issues List** - Table with filters
  - Columns: Issue Key, Severity, Pages Affected, Effort, Impact
  - Filters: Severity (all, high, med, low)
  - Sort: By impact, by effort, by pages

**Buttons:**
- **[Create Tasks]** → `POST /api/tasks/bulk-from-audit`
  - Modal to select issues and assign to project
  - Creates one task per selected issue
- **[Download PDF]** - Audit report
- **[Re-run]** → `/audit` with URL pre-filled

**RBAC:**
- LI org only
- `user` - View only
- `manager` - Run audits, create tasks
- `admin` - Full access

---

## 18. SitePanda — 3‑Click Site Builder

### Route: `/builder` (SitePanda only)

**Step 1: Keywords + Location**
- Fields:
  - Keywords (comma-separated)
  - City (required)
  - State (dropdown)
- Button: **[Continue]** → Step 2

**Step 2: Template Selection**
- Display: Grid of template cards with previews
- Buttons:
  - **[Back]** → Step 1
  - **Card [Select]** → Step 3

**Step 3: Review**
- Summary:
  - Keywords: [list]
  - Location: City, State
  - Template: [name]
- Buttons:
  - **[Back]** → Step 2
  - **[Build & Publish]** → `POST /api/sitepanda/build`
    - Creates `runs` entry with flow_key `/sitepanda/build`
    - Redirects to `/builder/runs`

### Route: `/builder/runs`

**Table Columns:**
- Domain
- Template
- Status (building → live → error)
- Indexed (yes/no)
- Created (date)

**Buttons:**
- **Row [Open Site]** - External link
- **Row [View Pages]** → `/sites/:id/pages`
- **Row [Re-build]** - If status is error

**RBAC:**
- SitePanda org only
- `user` - View only
- `manager` - Build sites
- `admin` - Full access

---

## 19. DU — GMB System

### Route: `/gmb` (DU only)

**Tabs:**
- Listings
- Posts
- Playbooks
- Suspensions

### Listings Tab

**Table Columns:**
- Name
- Place ID
- Status (pending → verified → suspended → reinstated)
- CTR Rate
- Reviews Count
- Last Checked (date)

**Buttons:**
- **[Add Listing]** → `/gmb/new`
- **Row [Verify]** → `POST /api/gmb/:id/verify`
- **Row [Create Post]** → `/gmb/:id/posts/new`
- **Row [Reinstate]** → `/gmb/:id/reinstate` (if suspended)
- **Row [Run CTR Cycle]** → `POST /api/runs` with flow_key `/du/gmb/ctr`

### Posts Tab

**Table Columns:**
- GMB Listing
- Kind (update, offer, event)
- Title
- Published (date)

**Buttons:**
- **[New Post]** → `/gmb/:id/posts/new`
- **Row [Edit]** → `/gmb/:id/posts/:postId/edit`

### Playbooks Tab

**List:**
- Verification Playbook
- Suspension Reinstatement Playbook
- CTR Optimization Playbook

**Buttons:**
- **[View]** - Opens playbook document

### Suspensions Tab

**Table:**
- Listing Name
- Suspended Date
- Reason (if known)
- Status (investigating, appealing, reinstated)

**Buttons:**
- **[Start Reinstatement]** - Launches playbook workflow

**RBAC:**
- DU org only
- `user` - View only
- `manager` - Create posts, verify listings
- `admin` - Full access including reinstatement

---

## 20. Assets Registry

### Route: `/assets`

**Table Columns:**
- Type (prompt, workflow, template, etc.)
- Name
- Owner (user)
- Version
- Usage (count of times used)

**Buttons:**
- **[New Asset]** → `/assets/new`
- **Row [Promote]** - Marks as default for type
- **Row [Deprecate]** - Marks as inactive

### Route: `/assets/:id`

**Sections:**
- **Metadata** - Type, name, version, owner
- **Content** - View/edit based on type
  - Prompt: Text editor
  - Workflow: JSON viewer
  - Template: Preview
- **Usage History** - Where and when used

**Buttons:**
- **[Edit]** → `/assets/:id/edit`
- **[Clone]** - Creates new version
- **[Delete]** - Confirm modal

**RBAC:**
- `user` - View only
- `manager` - Create, edit
- `admin` - Promote, deprecate, delete

---

## 21. R&D Lab

### Route: `/lab`

**Table Columns:**
- Experiment Name
- Hypothesis (brief)
- Metric (what's being measured)
- Status (draft → running → analyzing → promoted → failed)

**Buttons:**
- **[New Experiment]** → `/lab/new`
- **Row [Open]** → `/lab/:id`
- **Row [Promote to SOP]** → `POST /api/sops/promote`
  - Only if status is `analyzing` and results are positive

### Route: `/lab/:id`

**Sections:**
- **Hypothesis** - What we're testing
- **Setup** - How it's configured
- **Metrics** - KPIs being tracked
- **Results** - Data and analysis
- **Conclusion** - Promote or abandon

**Buttons:**
- **[Start]** - Changes status to `running`
- **[Stop]** - Changes status to `analyzing`
- **[Promote]** - Creates SOP from experiment
- **[Abandon]** - Changes status to `failed`

**RBAC:**
- `user` - View only
- `manager` - Create, run
- `admin` - Promote, abandon

---

## 22. Users & Roles

### Route: `/settings/users`

**Table Columns:**
- User (name + email)
- Role (user, manager, admin, super_*)
- Org Scope (for agency roles: [LI, SitePanda, DU])
- Last Login (date)

**Buttons:**
- **[Invite User]** → `/settings/users/invite`
  - Modal with email, role, org scope
  - Sends invitation email
- **Row [Change Role]** → Modal to update role
  - Confirm modal if promoting to admin
- **Row [Remove]** → Confirm modal → `DELETE /api/users/:id`

**RBAC:**
- Only `admin` and `super_admin` can access

---

## 23. Schedules

### Route: `/settings/schedules`

**Table Columns:**
- Name
- Type (report, audit, gmb post, etc.)
- Cron/Interval (e.g., "0 9 * * 1" = Mondays 9am)
- Last Run (timestamp)
- Next Run (calculated)

**Buttons:**
- **[New Schedule]** → `/settings/schedules/new`
- **Row [Run Now]** → `POST /api/schedules/:id/run`
- **Row [Pause]** - Toggle active state

### Route: `/settings/schedules/new` | `/settings/schedules/:id/edit`

**Fields:**
- Name (required)
- Type (dropdown: report, audit, gmb post, etc.)
- Cron Expression (text input with helper)
- Active (checkbox)

**Buttons:**
- **[Save]** → `POST /api/schedules` or `PUT /api/schedules/:id`
- **[Cancel]** → `/settings/schedules`

**RBAC:**
- `user` - No access
- `manager` - View only
- `admin` - Full access

---

## 24. System Health

### Route: `/system-health`

**Cards:**
- **Queue Depth** - Number of pending jobs
- **Failed Jobs** - Count in last 24h
- **Integration Health** - Status of all integrations
- **Uptime** - Last 30 days

**Buttons:**
- **[Open n8n]** - External link to n8n dashboard (admin only)
- **[Replay Dead Letter]** → `POST /api/runs/replay-dlq`
  - Retries all jobs in dead letter queue

**Charts:**
- Failed runs over time
- Integration health over time

**RBAC:**
- `user` - No access
- `manager` - View only
- `admin` - Full access including replay

---

## 25. Notifications

### Route: `/notifications`

**Table Columns:**
- Type (info, warning, error, success)
- Severity (low, medium, high, critical)
- Message
- Created (timestamp)
- Status (unread, read, archived)

**Filters:**
- Status (all, unread, read)
- Severity (all, high, critical)
- Type

**Buttons:**
- **[Mark Read]** - Bulk action for selected
- **[Mute Type]** - Don't show this type again
- **Row [Open Related]** - Links to entity (account, project, run, etc.)

**Real-time:**
- WebSocket updates for new notifications
- Bell icon badge count in top nav

**RBAC:**
- All roles can access their own notifications

---

## 26. Docs

### Route: `/docs`

**Sections:**
- **API** - REST API documentation
- **Webhooks** - Inbound/outbound webhook specs
- **Roles** - RBAC permission matrix
- **SOP Writing** - How to create SOPs
- **Builder** - SitePanda 3-click builder guide
- **Audit Tool** - LI site audit documentation
- **GMB** - DU GMB system guide

**Buttons:**
- **[Copy Examples]** - Code snippets to clipboard
- **[Open Postman Collection]** - External link

**Search:**
- Full-text search across all docs

**RBAC:**
- All roles can access

---

## 27. Error Pages

### Route: `/404`

**Content:**
- "Page not found"
- Suggested links based on user's role

**Buttons:**
- **[Go to Dashboard]** → `/dashboard`

### Route: `/403`

**Content:**
- "You don't have permission to access this page"
- Explanation of required role

**Buttons:**
- **[Go to Dashboard]** → `/dashboard`
- **[Request Access]** - Opens modal to request role upgrade

---

## Navigation Summary

### Primary Navigation
- Dashboard
- Accounts
- Projects
- Tasks
- Reports
- Metrics
- Integrations
- Webhooks
- Assets
- Lab
- System Health

### Secondary Navigation (Settings)
- Users
- Secrets
- Schedules
- Billing
- Docs

### Org-Specific Navigation
- **LI:** Audit Tool (`/audit`)
- **SitePanda:** Site Builder (`/builder`)
- **DU:** GMB System (`/gmb`)

### Mobile Navigation
- Hamburger menu for primary nav
- Bottom tab bar for most-used items:
  - Dashboard
  - Accounts
  - Projects
  - Notifications
  - Menu (opens hamburger)

---

## State Management

### Global State
- Current user (id, email, display_name, avatar_url)
- Current org (id, name, type, domain)
- Permitted orgs (for account switcher)
- Notifications (count, recent items)

### Route State
- Filters (persisted in URL query params)
- Sort order (persisted in URL query params)
- Pagination (persisted in URL query params)

### Form State
- Unsaved changes warning on navigation
- Auto-save drafts to localStorage
- Validation errors inline

---

## API Endpoints Summary

All endpoints follow REST conventions:

**Auth:**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/reset`

**Accounts:**
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:id`
- `PUT /api/accounts/:id`
- `DELETE /api/accounts/:id`

**Contacts:**
- `GET /api/accounts/:id/contacts`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

**Projects:**
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

**Tasks:**
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/bulk-from-audit`

**SOPs:**
- `GET /api/sops`
- `POST /api/sops`
- `GET /api/sops/:id`
- `PUT /api/sops/:id`
- `POST /api/sops/:id/promote`

**Runs:**
- `GET /api/runs`
- `POST /api/runs`
- `GET /api/runs/:id`
- `POST /api/runs/:id/retry`
- `POST /api/runs/replay-dlq`

**Reports:**
- `GET /api/reports`
- `POST /api/reports/generate`
- `GET /api/reports/:id`

**Metrics:**
- `GET /api/metrics`
- `GET /api/metrics/export`

**Billing:**
- `GET /api/billing`
- `GET /api/billing/invoices`

**Integrations:**
- `GET /api/integrations`
- `POST /api/integrations/:vendor/connect`
- `POST /api/integrations/:vendor/disconnect`
- `POST /api/integrations/:vendor/test`

**Secrets:**
- `GET /api/secrets`
- `POST /api/secrets/:id/rotate`
- `POST /api/secrets/:id/revoke`

**Webhooks:**
- `GET /api/webhooks/endpoints`
- `POST /api/webhooks/endpoints`
- `PUT /api/webhooks/endpoints/:id`
- `DELETE /api/webhooks/endpoints/:id`
- `POST /api/webhooks/test`
- `GET /api/webhooks/deliveries`
- `POST /api/webhooks/:deliveryId/retry`

**Audit (LI):**
- `POST /api/audit/run`
- `GET /api/audit/:id`
- `GET /api/audit/history`

**SitePanda:**
- `POST /api/sitepanda/build`
- `GET /api/sites`
- `GET /api/sites/:id`
- `GET /api/sites/:id/pages`

**GMB (DU):**
- `GET /api/gmb/listings`
- `POST /api/gmb/listings`
- `POST /api/gmb/:id/verify`
- `POST /api/gmb/:id/reinstate`
- `GET /api/gmb/:id/posts`
- `POST /api/gmb/:id/posts`

**Assets:**
- `GET /api/assets`
- `POST /api/assets`
- `GET /api/assets/:id`
- `PUT /api/assets/:id`
- `POST /api/assets/:id/promote`
- `DELETE /api/assets/:id`

**Lab:**
- `GET /api/lab/experiments`
- `POST /api/lab/experiments`
- `GET /api/lab/experiments/:id`
- `PUT /api/lab/experiments/:id`
- `POST /api/lab/experiments/:id/promote`

**Users:**
- `GET /api/users`
- `POST /api/users/invite`
- `PUT /api/users/:id/role`
- `DELETE /api/users/:id`

**Schedules:**
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `POST /api/schedules/:id/run`
- `DELETE /api/schedules/:id`

**Notifications:**
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `POST /api/notifications/mute`

---

## Outcome

**Click-complete wireframe.** Every button resolves to a route or API action. Styling left to implementation (Tailwind + shadcn/ui).

**See Also:**
- [APP_SPEC.md](./APP_SPEC.md) - Full application specification
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete database schema
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment procedures

