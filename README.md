# Unified Operations Platform

A comprehensive multi-tenant operations platform consolidating **SitePanda**, **Decisions Unlimited (DU)**, and **Logic Inbound (LI)** under a unified agency management system.

## Overview

Unified Ops is a white-labeled, domain-scoped platform that provides:

- **Multi-tenant architecture** with Row-Level Security (RLS)
- **Domain-aware routing** (my.logicinbound.com, my.sitepanda.com, my.decisionsunlimited.io, agency.unifiedops.app)
- **Role-Based Access Control (RBAC)** with super admin capabilities
- **Per-org integrations** (Discord/Slack, GHL, Google, Stripe, OpenAI, DataForSEO, Duda)
- **Webhook framework** (inbound/outbound with HMAC signing)
- **Automation engine** (n8n workflows with retry logic)
- **KMS-encrypted secrets** per organization

## Documentation

This repository contains **complete technical documentation** covering architecture, database, deployment, and UI specifications.

### 📋 [APP_SPEC.md](./APP_SPEC.md)
**Complete application specification** covering:
- System architecture and modules
- Multi-tenant design patterns
- Integration framework (GHL, Slack, Discord, Stripe, GA4, etc.)
- Webhook system (HMAC-signed, retry logic, DLQ)
- Automation framework (n8n workflows)
- Security & compliance (KMS encryption, RLS, audit logs)
- Service-level objectives (SLOs)
- Rollout plan (5 phases)

### 🗄️ [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
**Complete PostgreSQL schema** with:
- 30+ tables with full CREATE statements
- 5 enum types (role, org_type, event_key, task_status, project_stage)
- Identity & organization tables (users, orgs, org_domains, role_bindings)
- Integrations & secrets (KMS-encrypted)
- Webhooks (endpoints, deliveries, inbound)
- Core business (accounts, contacts, projects, tasks, sops)
- Automation (runs, events, audit_logs)
- Metrics & reporting (partitioned metrics_daily, reports, billing)
- LI specific (audits, audit_issues)
- SitePanda specific (sites, site_pages)
- DU specific (gmblistings, gmb_posts)
- Indexes and Row-Level Security policies
- Optimization notes (partitioning, materialized views, object storage)

### 🎨 [UI_REQUIREMENTS.md](./UI_REQUIREMENTS.md)
**Complete wireframe specification** with:
- 27 fully specified pages with routes and interactions
- Global UI patterns (navigation, RBAC, feedback, tables)
- Auth flow with org resolution
- Dashboards (subaccount + agency)
- Core pages (accounts, contacts, projects, tasks, SOPs, runs, reports, metrics, billing)
- Settings pages (integrations, secrets, webhooks, users, schedules)
- Org-specific pages:
  - **LI:** Site Audit Tool
  - **SitePanda:** 3-Click Site Builder
  - **DU:** GMB System
- Advanced features (onboarding wizard, assets registry, R&D lab, system health)
- Complete API endpoint reference (80+ endpoints)
- State management patterns
- Mobile navigation

### 🚀 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
**Deployment procedures and troubleshooting** with:
- Quick deployment checklist
- Common issues & solutions (Tailwind build, rate limiter, proxy config)
- Efficient debugging workflow
- Time-saving tips (SSH keys, deployment scripts, aliases)
- Case studies from production deployments
- Emergency rollback procedures

## Tech Stack

### Backend
- **Runtime:** Node.js 22.x
- **Framework:** Express.js
- **Database:** PostgreSQL 16 with Row-Level Security (RLS)
- **ORM:** Prisma (optional) or raw SQL
- **Authentication:** JWT with refresh tokens
- **Secrets:** KMS encryption (AWS KMS or similar)
- **Automation:** n8n (self-hosted)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Context + URL state
- **Forms:** React Hook Form + Zod validation
- **API Client:** Fetch with middleware

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx with Let's Encrypt
- **Deployment:** Ubuntu 22.04 VPS
- **Monitoring:** n8n health checks + custom dashboards
- **Logging:** Structured logs with Winston

### Integrations
- **Communications:** Slack (SitePanda/DU), Discord (LI)
- **CRM:** GoHighLevel v2
- **Analytics:** Google Analytics 4
- **Payments:** Stripe
- **AI:** OpenAI API
- **SEO Data:** DataForSEO
- **Site Builder:** Duda (SitePanda only)

## Architecture

### Multi-Tenancy
- **Tenant Isolation:** `org_id` on all tables + RLS policies
- **Domain Routing:** Middleware resolves org from domain
- **Context Setting:** `SET app.org_id = $1` per request
- **RBAC:** `role_bindings` table with org-scoped roles

### Webhook System
- **Outbound:** HMAC-SHA256 signed, exponential backoff retry (6 attempts)
- **Inbound:** Signature validation, idempotency keys
- **Delivery Log:** Append-only `webhook_deliveries` table
- **Dead Letter Queue:** Failed deliveries after max retries

### Automation Framework
- **Engine:** n8n workflows
- **Execution Log:** `runs` table with flow_key, status, artifacts
- **Retry Logic:** Manual retry from UI or automatic for transient failures
- **Artifacts:** Stored in S3 with org_id-scoped prefixes

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22.x (for local development)
- PostgreSQL 16 (or use Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/steadycalls/unified-ops-platform.git
cd unified-ops-platform

# Set up environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit .env files with your configuration
# - Database credentials
# - JWT secrets
# - Integration API keys (OpenAI, DataForSEO, etc.)
# - Slack/Discord tokens

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Access the platform
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - Database: localhost:5432
```

### Initial Setup

1. **Create database schema:**
   ```bash
   docker exec -i unified-ops-db psql -U postgres -d unified_ops < DATABASE_SCHEMA.sql
   ```

2. **Create super admin user:**
   ```bash
   # See DATABASE_SCHEMA.md for SQL to create admin user
   ```

3. **Configure integrations:**
   - Navigate to `/settings/integrations`
   - Add API keys for OpenAI, DataForSEO, etc.
   - Connect Slack (SitePanda/DU) or Discord (LI)

4. **Set up webhooks:**
   - Navigate to `/settings/webhooks`
   - Configure outbound endpoints for events
   - Copy inbound webhook URLs for external services

## Development

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# Database (if not using Docker)
psql -U postgres -d unified_ops
```

### Project Structure

```
unified-ops-platform/
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── accounts/           # Accounts management
│   │   ├── projects/           # Projects management
│   │   ├── tasks/              # Task management
│   │   ├── settings/           # Settings pages
│   │   ├── audit/              # LI Site Audit Tool
│   │   ├── builder/            # SitePanda 3-Click Builder
│   │   └── gmb/                # DU GMB System
│   ├── components/             # Reusable React components
│   ├── lib/                    # Utilities and helpers
│   └── public/                 # Static assets
├── backend/
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities
│   └── server.js               # Express app entry point
├── database/
│   └── schema.sql              # PostgreSQL schema
├── docs/                       # Additional documentation
├── APP_SPEC.md                 # Application specification
├── DATABASE_SCHEMA.md          # Database schema documentation
├── UI_REQUIREMENTS.md          # UI wireframe specification
├── DEPLOYMENT_GUIDE.md         # Deployment procedures
├── docker-compose.yml          # Docker services configuration
└── README.md                   # This file
```

### Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# E2E tests
npm run test:e2e
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment procedures.

### Production Deployment

1. **Server Setup:**
   - Ubuntu 22.04 VPS
   - Docker & Docker Compose installed
   - Nginx with Let's Encrypt SSL

2. **Environment Configuration:**
   - Set production environment variables
   - Configure KMS for secret encryption
   - Set up backup strategy

3. **Deploy:**
   ```bash
   # On production server
   cd /opt/unified-ops/unified-ops-platform
   git pull origin master
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Verify:**
   - Check container health: `docker-compose ps`
   - Check logs: `docker-compose logs -f`
   - Test login at production domain

### Production URLs
- **LI:** https://my.logicinbound.com
- **SitePanda:** https://my.sitepanda.com
- **DU:** https://my.decisionsunlimited.io
- **Agency:** https://agency.unifiedops.app

## Security

### Authentication
- JWT access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- HTTP-only cookies for tokens
- CSRF protection

### Authorization
- Row-Level Security (RLS) on all tenant tables
- RBAC with 6 roles: user, manager, admin, super_user, super_manager, super_admin
- Permission checks at API layer + database layer

### Secrets Management
- KMS encryption for `org_secrets.enc_blob`
- Secrets never exposed to frontend
- Rotation tracking with `rotated_at` timestamp
- Alert when secrets > 90 days old

### Webhooks
- HMAC-SHA256 signing for outbound webhooks
- Signature validation for inbound webhooks
- Replay attack prevention with timestamps

### Audit Trail
- All mutations logged in `audit_logs` table
- User, action, entity, timestamp
- Immutable append-only log

## Contributing

This is a proprietary project. For internal team members:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with descriptive messages
4. Push and create a pull request
5. Request review from team lead

## Support

For issues or questions:
- **Internal Team:** Slack #unified-ops channel
- **Documentation:** See docs/ folder
- **API Docs:** Navigate to `/docs` in the platform

## License

**Proprietary - All rights reserved**

© 2025 Unified Operations Platform. This software and associated documentation are confidential and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Quick Links

- [Application Specification](./APP_SPEC.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [UI Requirements](./UI_REQUIREMENTS.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Server](https://m.kyleroelofs.com)
- [GitHub Repository](https://github.com/steadycalls/unified-ops-platform)

