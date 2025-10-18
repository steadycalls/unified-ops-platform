# Unified Operations Platform - Complete Description

## Executive Summary

The **Unified Operations Platform** is a multi-tenant SaaS application designed to streamline business operations, client management, project tracking, and SEO services. Built with a modern tech stack (Next.js 14, Node.js, PostgreSQL), it features a professional dark navy UI inspired by DUFulfill and includes integrated SEO research tools from SitePanda.

**This platform serves three distinct business units:**
1. **SitePanda** - SEO and local website generation services
2. **Decisions Unlimited (DU)** - Business consulting and strategic services
3. **Logic Inbound** - Marketing automation and lead generation

Each business unit operates as a separate organization within the platform with its own branding, domain, clients, projects, and workflows while sharing the same underlying infrastructure.

---

## Platform Overview

### Purpose
Centralized operations management platform that serves multiple business units with:
- **Multi-tenant architecture** supporting separate organizations
- **Organization-specific branding** and customization
- **Shared infrastructure** with isolated data
- Client and contact management per organization
- Project tracking and opportunity pipelines
- Process documentation with SOPs
- External tool integration via webhooks
- SEO keyword research and competitor analysis (SitePanda)
- AI-powered content generation (SitePanda)

### Target Users
- **SitePanda Team:** SEO specialists, content creators, web developers
- **Decisions Unlimited Team:** Business consultants, strategists, analysts
- **Logic Inbound Team:** Marketing specialists, automation experts, lead generation
- **Shared Users:** Operations managers, administrators across all units

---

## Technical Architecture

### Frontend Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **UI Theme:** Dark navy professional aesthetic (DUFulfill-inspired)
- **State Management:** React hooks and localStorage
- **Routing:** Next.js App Router with dynamic routes

### Backend Stack
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL with connection pooling
- **Authentication:** JWT-based with bcrypt password hashing
- **API Design:** RESTful with versioned endpoints (`/api/v1/`)
- **Middleware:** CORS, body-parser, custom auth middleware

### Database Schema
**Core Tables:**
- `users` - User accounts with authentication
- `organizations` - Multi-tenant organization data
- `user_organizations` - Many-to-many relationship with roles
- `clients` - Client/contact management
- `projects` - Project tracking with status
- `opportunities` - Sales pipeline management
- `notes` - Documentation and knowledge base
- `integrations` - External service connections
- `webhooks` - Outgoing webhook configurations
- `sops` - Standard Operating Procedures

### Deployment
- **VPS Hosting:** Ubuntu server with systemd services
- **Backend Service:** PM2 process manager on port 3001
- **Frontend Service:** Next.js production build on port 3000
- **Reverse Proxy:** Nginx with SSL/TLS termination
- **Database:** PostgreSQL 14+ with automated backups

---

## Feature Modules

### 1. A### Multi-Tenant Architecture

**Login System:**
- Email/password authentication
- JWT token generation (access + refresh tokens)
- Secure password hashing with bcrypt
- Organization-based branding support
- Session persistence with localStorage
- Domain-based organization detection

**Multi-Tenant Architecture:**
- Organization-level data isolation (complete separation)
- Role-based access control (admin, member, viewer)
- User can belong to multiple organizations
- Organization slug-based routing (`/api/v1/:orgSlug/...`)
- Tenant-specific branding (logo, colors, domain)

**Three Primary Organizations:**

1. **SitePanda** (`sitepanda`)
   - **Domain:** sitepandaseo.com
   - **Focus:** Local SEO website generation
   - **Primary Features:** Keyword research, competitor analysis, site plans, content generation
   - **Branding:** Panda emoji 🐼, SEO-focused messaging
   - **Clients:** Local businesses needing SEO websites
   - **Projects:** Website builds, content campaigns, SEO audits

2. **Decisions Unlimited** (`du`)
   - **Domain:** ducrm.com
   - **Focus:** Business consulting and strategic planning
   - **Primary Features:** Client management, project tracking, SOPs, documentation
   - **Branding:** Professional consulting aesthetic
   - **Clients:** Businesses seeking strategic guidance
   - **Projects:** Consulting engagements, strategy development, implementation

3. **Logic Inbound** (`logicinbound`)
   - **Domain:** my.logicinbound.com
   - **Focus:** Marketing automation and lead generation
   - **Primary Features:** Opportunity pipeline, integrations, webhooks, automation
   - **Branding:** Marketing-focused messaging
   - **Clients:** Businesses needing lead generation
   - **Projects:** Marketing campaigns, automation setup, lead nurturing

**User Roles:**
- **Admin:** Full access to organization data
- **Member:** Standard user access
- **Viewer:** Read-only access

**Cross-Organization Users:**
- Kyle Roelofs (admin across all three organizations)
- Shared team members can access multiple organizations
- Organization switcher in user interface
- Separate data contexts per organization

---

### 2. Dashboard

**Overview Stats:**
- Total Clients count
- Active Projects count
- Opportunities pipeline
- Revenue Pipeline value

**### Organizations Section:
- Grid view of user's organizations
- Organization name, role, and domain
- "Open Organization" button with direct links to:
  - **SitePanda:** sitepandaseo.com
  - **Decisions Unlimited:** ducrm.com
  - **Logic Inbound:** my.logicinbound.com
- Active status badges
- Organization-specific branding and icons**Quick Actions Grid:**
- Icon-based navigation to all modules
- Clients, Projects, Opportunities, Notes
- Integrations, Webhooks, SOPs, Monitoring
- SitePanda SEO tools

**Platform Status:**
- Backend online indicator
- Database connection status
- All services running confirmation

---

### 3. Client Management

**Features:**
- Add/Edit/Delete clients
- Company name and contact details
- Email, phone, and address fields
- Status tracking (active, inactive, lead)
- Tags for categorization
- Search and filter functionality

**UI Components:**
- Professional data table with sorting
- Dark theme modal forms
- Icon-prefixed input fields
- Status badges (color-coded)
- Responsive grid layout

**Data Fields:**
- Company Name
- First Name / Last Name
- Email (required)
- Phone
- Status (dropdown)
- Tags (comma-separated)

---

### 4. Project Management

**Features:**
- Create and track projects
- Link projects to clients
- Status workflow (planning, active, completed, on-hold)
- Priority levels (low, medium, high)
- Start and end dates
- Budget tracking
- Notes and descriptions

**Project Statuses:**
- Planning
- Active
- Completed
- On Hold

**UI Features:**
- Kanban-style status view
- Project cards with key metrics
- Client association
- Timeline visualization
- Budget vs actual tracking

---

### 5. Opportunities (Sales Pipeline)

**Features:**
- Lead and opportunity tracking
- Sales stage management
- Value/revenue estimation
- Probability scoring
- Expected close dates
- Client association

**Sales Stages:**
- Lead
- Qualified
- Proposal
- Negotiation
- Closed Won
- Closed Lost

**Pipeline Metrics:**
- Total opportunity value
- Weighted pipeline (value × probability)
- Win rate calculation
- Average deal size
- Sales velocity

---

### 6. Notes & Documentation

**Features:**
- Rich text note creation
- Categorization and tagging
- Link notes to clients/projects
- Search and filter
- Markdown support
- Timestamps and author tracking

**Use Cases:**
- Meeting notes
- Client communications
- Project documentation
- Internal knowledge base
- Process documentation

---

### 7. Integrations

**Purpose:**
Connect external services and tools to the platform

**Supported Integration Types:**
- CRM systems
- Marketing automation
- Analytics platforms
- Communication tools
- Payment processors
- Project management tools

**Configuration:**
- API key management
- OAuth connection flow
- Webhook endpoint setup
- Data sync settings
- Connection status monitoring

---

### 8. Webhooks (Outgoing)

**Features:**
- Configure outgoing webhook endpoints
- Event-based triggers
- Custom payload formatting
- Retry logic with exponential backoff
- Webhook logs and monitoring
- Authentication (API keys, signatures)

**Supported Events:**
- Client created/updated
- Project status changed
- Opportunity won/lost
- Note created
- Custom events

**Configuration:**
- Target URL
- HTTP method (POST, PUT, PATCH)
- Headers and authentication
- Event selection
- Payload template

---

### 9. SOPs (Standard Operating Procedures)

**Features:**
- Create and manage process documentation
- Step-by-step procedure guides
- Categorization by department/function
- Version control
- Approval workflow
- Search and filter

**SOP Structure:**
- Title and description
- Category/department
- Step-by-step instructions
- Required tools/resources
- Responsible roles
- Review date

**Use Cases:**
- Onboarding procedures
- Client intake process
- Project delivery workflow
- Quality assurance checklists
- Emergency protocols

---

### 10. SitePanda SEO Module

**Organization-Specific Feature**

Integrated SEO research and content generation tools **exclusively for SitePanda organization**. This module is not available to Decisions Unlimited or Logic Inbound users.

**Access Control:**
- Only visible to users with SitePanda organization membership
- Navigation menu shows "🐼 SitePanda SEO" only for SitePanda users
- All SEO data scoped to SitePanda organization
- Separate billing/usage tracking for SitePanda

#### 10.1 Keyword Research (`/sitepandaseo`)

**Features:**
- Location-based keyword research
- Cascading location selector (Country → State → City)
- Business niche targeting
- Seed keyword suggestions
- Search volume data
- Keyword difficulty scoring
- CPC (Cost Per Click) metrics
- Competition analysis

**Data Displayed:**
- Keyword phrase
- Monthly search volume
- Difficulty score (color-coded: green/yellow/red)
- Cost per click
- Competition level
- Average metrics dashboard

**UI Design:**
- Dark theme form with icon prefixes
- Sticky sidebar form layout
- Professional data table
- Quick stats cards
- Responsive design

**Mock Data:**
Currently uses simulated data; ready for DataForSEO API integration.

---

#### 10.2 Competitor Analysis (`/sitepandaseo/competitors`)

**Features:**
- Identify top-ranking competitors
- Map Pack vs Organic results
- Business information extraction
- SEO optimization analysis
- CSV export functionality

**Analysis Metrics:**
- Competitor position/ranking
- Business name and domain
- Rating and review count
- Phone and website
- Service keyword in title
- City keyword in title
- Optimization flags

**Analysis Depth Options:**
- Top 5 results
- Top 10 results
- Top 20 results
- Top 50 results

**Stats Dashboard:**
- Map Pack competitor count
- Organic competitor count
- Average rating
- Average review count
- Website presence percentage

---

#### 10.3 Site Plans (`/sitepandaseo/site-plans`)

**Purpose:**
Blueprint for website structure and content strategy

**Features:**
- Create site plans for local businesses
- Define business details and location
- Target keyword planning
- Business description
- Content goals and requirements
- Status tracking (draft, in progress, completed)

**Site Plan Data:**
- Business name
- Niche (industry/service type)
- City and state
- Target keywords (multiline)
- Business description
- Content goals
- Page count
- Keyword count

**UI Components:**
- Grid view of site plans
- Status badges
- Creation date tracking
- View/Edit actions
- Stats overview (total plans, in progress, completed)

---

#### 10.4 Content Generation (`/sitepandaseo/content`)

**Purpose:**
AI-powered content creation for SEO websites

**Features:**
- Generate content for multiple page types
- Word count selection
- Tone customization
- Keyword integration
- Content library management
- Status tracking

**Page Types:**
- Home Page
- About Page
- Services Page
- Contact Page
- Location Page
- Blog Post
- FAQ Page
- Testimonials Page

**Content Configuration:**
- Site name
- Page type selector
- Word count (500-2000 words)
- Target keywords
- Content brief/instructions
- Tone (professional, friendly, authoritative, conversational)

**Content Library:**
- Table view of all generated content
- Status tracking (draft, generated, published)
- Word count display
- Creation date
- View/Edit actions
- Total words statistics

**Stats Dashboard:**
- Total content items
- Published count
- Generated count
- Total word count

---

## Design System

### Color Palette (DUFulfill-Inspired)

**Primary Colors:**
- Background: `#1a2332` (Dark navy)
- Card Background: `#232f42` (Lighter navy)
- Sidebar: `#151e2c` (Darker navy)
- Primary Accent: `#3b82f6` (Blue)
- Text: `#f8fafc` (Light gray)
- Muted Text: `#94a3b8` (Medium gray)
- Border: `#313d52` (Dark gray)

**Status Colors:**
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Error: `#ef4444` (Red)
- Info: `#3b82f6` (Blue)

### Typography
- **Font Family:** System fonts (San Francisco, Segoe UI, Roboto)
- **Headings:** Bold, larger sizes with proper hierarchy
- **Body Text:** Regular weight, readable line height
- **Muted Text:** Lighter color for secondary information

### Components

**Cards:**
- Gradient backgrounds
- Subtle shadows
- Rounded corners (0.75rem)
- Hover effects (scale + border glow)
- Smooth transitions

**Buttons:**
- Primary: Blue gradient with glow on hover
- Secondary: Gray background with hover state
- Disabled: Reduced opacity
- Active state: Scale down effect

**Forms:**
- Dark input backgrounds
- Icon prefixes for context
- Blue focus rings
- Disabled state styling
- Validation feedback

**Tables:**
- Header with uppercase labels
- Hover row highlighting
- Alternating row colors (subtle)
- Responsive horizontal scroll
- Action buttons in last column

**Badges:**
- Rounded pill shape
- Color-coded by status
- Border matching background
- Small text size
- Icon support

**Sidebar:**
- Collapsible navigation
- Icon-based menu items
- Active state highlighting (blue accent + left border)
- User profile section
- Smooth transitions

---

## API Endpoints

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Organizations
```
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
```

### Clients
```
GET    /api/v1/:orgSlug/clients
POST   /api/v1/:orgSlug/clients
GET    /api/v1/:orgSlug/clients/:id
PATCH  /api/v1/:orgSlug/clients/:id
DELETE /api/v1/:orgSlug/clients/:id
```

### Projects
```
GET    /api/v1/:orgSlug/projects
POST   /api/v1/:orgSlug/projects
GET    /api/v1/:orgSlug/projects/:id
PATCH  /api/v1/:orgSlug/projects/:id
DELETE /api/v1/:orgSlug/projects/:id
```

### Opportunities
```
GET    /api/v1/:orgSlug/opportunities
POST   /api/v1/:orgSlug/opportunities
GET    /api/v1/:orgSlug/opportunities/:id
PATCH  /api/v1/:orgSlug/opportunities/:id
DELETE /api/v1/:orgSlug/opportunities/:id
```

### Notes
```
GET    /api/v1/:orgSlug/notes
POST   /api/v1/:orgSlug/notes
GET    /api/v1/:orgSlug/notes/:id
PATCH  /api/v1/:orgSlug/notes/:id
DELETE /api/v1/:orgSlug/notes/:id
```

### Webhooks
```
GET    /api/v1/:orgSlug/webhooks
POST   /api/v1/:orgSlug/webhooks
GET    /api/v1/:orgSlug/webhooks/:id
PATCH  /api/v1/:orgSlug/webhooks/:id
DELETE /api/v1/:orgSlug/webhooks/:id
POST   /api/v1/:orgSlug/webhooks/:id/test
```

### SOPs
```
GET    /api/v1/:orgSlug/sops
POST   /api/v1/:orgSlug/sops
GET    /api/v1/:orgSlug/sops/:id
PATCH  /api/v1/:orgSlug/sops/:id
DELETE /api/v1/:orgSlug/sops/:id
```

---

## Security Features

### Authentication
- JWT-based authentication
- Refresh token rotation
- Secure password hashing (bcrypt)
- Token expiration (15 min access, 7 day refresh)
- HTTP-only cookies for tokens

### Authorization
- Role-based access control (RBAC)
- Organization-level data isolation
- API endpoint protection
- User permission validation

### Data Protection
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configuration
- Rate limiting
- Input validation and sanitization

---

## Deployment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/unified_ops
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unified_ops
DB_USER=unified_ops_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=3001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Systemd Services

**Backend Service (`/etc/systemd/system/unified-ops-backend.service`):**
```ini
[Unit]
Description=Unified Operations Platform Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/unified-ops/unified-ops-platform/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Frontend Service (`/etc/systemd/system/unified-ops-frontend.service`):**
```ini
[Unit]
Description=Unified Operations Platform Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/unified-ops/unified-ops-platform/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Development Workflow

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/steadycalls/unified-ops-platform.git
cd unified-ops-platform

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Create database
createdb unified_ops

# Run migrations
psql unified_ops < backend/database/schema.sql
```

### Git Workflow
- **Main Branch:** `master`
- **Feature Branches:** `feature/feature-name`
- **Commit Messages:** Descriptive with bullet points
- **Pull Requests:** Required for major changes

---

## Future Enhancements

### Planned Features
1. **Advanced Analytics Dashboard**
   - Revenue forecasting
   - Client lifetime value
   - Project profitability analysis
   - Team performance metrics

2. **Team Collaboration**
   - Real-time comments
   - @mentions and notifications
   - Task assignments
   - Activity feed

3. **API Integration Marketplace**
   - Pre-built integrations
   - One-click setup
   - Data sync automation

4. **Mobile App**
   - iOS and Android native apps
   - Offline mode
   - Push notifications

5. **AI Enhancements**
   - Actual OpenAI integration for content generation
   - DataForSEO API for real keyword data
   - Automated competitor monitoring
   - Smart recommendations

6. **Reporting & Export**
   - Custom report builder
   - PDF export
   - Excel/CSV export
   - Scheduled reports

7. **White-Label Options**
   - Custom branding per organization
   - Custom domain support
   - Branded client portals

---

## Support & Documentation

### Resources
- **GitHub Repository:** https://github.com/steadycalls/unified-ops-platform
- **Issue Tracker:** GitHub Issues
- **Documentation:** This file + inline code comments

### Getting Help
- Check existing GitHub issues
- Review code comments and documentation
- Contact development team

---

## License & Credits

**Platform:** Unified Operations Platform  
**Developer:** Kyle Roelofs / SteadyCalls  
**Design Inspiration:** DUFulfill.com  
**SEO Module:** Based on SitePanda SEO platform  
**Tech Stack:** Next.js, Node.js, PostgreSQL, Tailwind CSS

---

## Conclusion

The Unified Operations Platform is a comprehensive business management solution with integrated SEO tools, designed for agencies and service businesses. With its professional DUFulfill-inspired UI, multi-tenant architecture, and extensive feature set, it provides a solid foundation for managing clients, projects, and operations while offering powerful SEO research and content generation capabilities.

The platform is production-ready, deployed on VPS infrastructure, and actively maintained with regular updates and improvements.




---

## Organization-Specific Workflows

### SitePanda Workflow

**Primary Use Case:** Local SEO website generation for small businesses

**Typical Process:**
1. **Research Phase**
   - Conduct keyword research for target niche and location
   - Analyze competitors in the local market
   - Identify ranking opportunities

2. **Planning Phase**
   - Create site plan with business details
   - Define target keywords and content strategy
   - Set up project in project management

3. **Content Generation**
   - Generate AI-powered content for all pages
   - Optimize for target keywords
   - Review and edit generated content

4. **Delivery Phase**
   - Build and deploy website
   - Track project status
   - Manage client communications

**Key Features Used:**
- SitePanda SEO module (keyword research, competitor analysis)
- Site Plans
- Content Generation
- Client Management
- Project Tracking

**Team Roles:**
- SEO Specialists: Research and strategy
- Content Creators: Content review and optimization
- Web Developers: Site deployment
- Account Managers: Client communication

---

### Decisions Unlimited Workflow

**Primary Use Case:** Business consulting and strategic planning engagements

**Typical Process:**
1. **Client Intake**
   - Add client to CRM
   - Document initial consultation notes
   - Create opportunity in sales pipeline

2. **Engagement Setup**
   - Create project for consulting engagement
   - Define scope and deliverables
   - Set timeline and milestones

3. **Execution**
   - Document processes in SOPs
   - Track project progress
   - Maintain detailed notes and documentation

4. **Delivery & Follow-up**
   - Complete deliverables
   - Update project status
   - Track ongoing opportunities

**Key Features Used:**
- Client Management
- Opportunity Pipeline
- Project Tracking
- Notes & Documentation
- SOPs (Standard Operating Procedures)

**Team Roles:**
- Business Consultants: Strategy development
- Analysts: Research and analysis
- Project Managers: Engagement coordination
- Account Managers: Client relationships

---

### Logic Inbound Workflow

**Primary Use Case:** Marketing automation and lead generation campaigns

**Typical Process:**
1. **Lead Capture**
   - Track opportunities in pipeline
   - Qualify leads by stage
   - Assign to team members

2. **Campaign Setup**
   - Create project for campaign
   - Configure integrations (CRM, email, ads)
   - Set up webhooks for automation

3. **Automation**
   - Configure webhook triggers
   - Set up automated workflows
   - Monitor integration status

4. **Optimization**
   - Track opportunity progression
   - Analyze conversion rates
   - Document successful processes in SOPs

**Key Features Used:**
- Opportunity Pipeline (primary focus)
- Integrations
- Webhooks (Outgoing)
- Project Tracking
- Client Management

**Team Roles:**
- Marketing Specialists: Campaign strategy
- Automation Experts: Technical setup
- Lead Generation Specialists: Qualification and nurturing
- Account Managers: Client success

---

## Organization-Specific Customizations

### Branding Customization

**SitePanda:**
- **Primary Color:** Blue (#3b82f6) - SEO/tech focused
- **Logo/Icon:** 🐼 Panda emoji
- **Tagline:** "Local SEO Made Simple"
- **Navigation:** Includes SitePanda SEO menu item
- **Dashboard:** SEO-focused quick actions

**Decisions Unlimited:**
- **Primary Color:** Professional blue/navy
- **Logo/Icon:** 📊 Chart/analytics emoji
- **Tagline:** "Strategic Business Solutions"
- **Navigation:** Standard CRM features
- **Dashboard:** Consulting-focused metrics

**Logic Inbound:**
- **Primary Color:** Marketing green/blue
- **Logo/Icon:** 🎯 Target emoji
- **Tagline:** "Marketing Automation Experts"
- **Navigation:** Emphasis on integrations and webhooks
- **Dashboard:** Lead generation metrics

### Feature Access Matrix

| Feature | SitePanda | Decisions Unlimited | Logic Inbound |
|---------|-----------|---------------------|---------------|
| Client Management | ✅ | ✅ | ✅ |
| Project Tracking | ✅ | ✅ | ✅ |
| Opportunities | ✅ | ✅ | ✅ (Primary) |
| Notes | ✅ | ✅ | ✅ |
| Integrations | ✅ | ✅ | ✅ (Primary) |
| Webhooks | ✅ | ✅ | ✅ (Primary) |
| SOPs | ✅ | ✅ (Primary) | ✅ |
| **Keyword Research** | ✅ (Exclusive) | ❌ | ❌ |
| **Competitor Analysis** | ✅ (Exclusive) | ❌ | ❌ |
| **Site Plans** | ✅ (Exclusive) | ❌ | ❌ |
| **Content Generation** | ✅ (Exclusive) | ❌ | ❌ |

### Data Isolation

**Complete Separation:**
- Each organization has its own clients (no sharing)
- Projects are organization-specific
- Opportunities are organization-specific
- Notes are organization-specific
- Integrations are configured per organization
- Webhooks are organization-specific
- SOPs are organization-specific

**Shared Elements:**
- User accounts (can belong to multiple orgs)
- Platform infrastructure
- Authentication system
- UI/UX design system

### Domain Routing

**Production Domains:**
- **sitepandaseo.com** → SitePanda organization context
- **ducrm.com** → Decisions Unlimited organization context
- **my.logicinbound.com** → Logic Inbound organization context

**Organization Detection:**
```javascript
// Frontend: Detect organization from domain
const getOrgFromDomain = () => {
  const hostname = window.location.hostname;
  if (hostname.includes('sitepanda')) return 'sitepanda';
  if (hostname.includes('ducrm')) return 'du';
  if (hostname.includes('logicinbound')) return 'logicinbound';
  return 'sitepanda'; // default
};

// Backend: Organization-scoped API routes
app.get('/api/v1/:orgSlug/clients', authenticateToken, async (req, res) => {
  const { orgSlug } = req.params;
  // Validate user has access to this organization
  // Return only clients for this organization
});
```

---

## Multi-Organization User Experience

### Organization Switcher

**Dashboard View:**
When a user belongs to multiple organizations, they see:
1. **"Your Organizations" section** with cards for each organization
2. **"Open [Organization Name]" buttons** to switch context
3. **Current organization indicator** in sidebar
4. **Organization-specific data** in all views

**Example: Kyle Roelofs Dashboard**
```
Your Organizations:
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 🐼 SitePanda        │ │ 📊 Decisions Unltd  │ │ 🎯 Logic Inbound    │
│ admin               │ │ admin               │ │ admin               │
│ sitepandaseo.com    │ │ ducrm.com           │ │ my.logicinbound.com │
│ [Open SitePanda →]  │ │ [Open DU →]         │ │ [Open Logic →]      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### Navigation Differences

**SitePanda Navigation:**
- 📊 Dashboard
- 👥 Clients
- 📁 Projects
- 💡 Opportunities
- 📝 Notes
- **🐼 SitePanda SEO** ← Exclusive
  - Keyword Research
  - Competitor Analysis
  - Site Plans
  - Content Generation
- 🔗 Integrations
- 🌐 Webhooks
- 📚 SOPs

**Decisions Unlimited Navigation:**
- 📊 Dashboard
- 👥 Clients
- 📁 Projects
- 💡 Opportunities
- 📝 Notes
- 🔗 Integrations
- 🌐 Webhooks
- **📚 SOPs** ← Emphasized
- 📊 Monitoring

**Logic Inbound Navigation:**
- 📊 Dashboard
- 👥 Clients
- 📁 Projects
- **💡 Opportunities** ← Emphasized
- 📝 Notes
- **🔗 Integrations** ← Emphasized
- **🌐 Webhooks** ← Emphasized
- 📚 SOPs
- 📊 Monitoring

---

## Billing & Usage Tracking (Future)

### Per-Organization Billing

**SitePanda:**
- Charge per keyword research
- Charge per competitor analysis
- Charge per site plan created
- Charge per content piece generated
- Monthly subscription tier

**Decisions Unlimited:**
- Charge per active project
- Charge per client
- Monthly subscription tier
- Consulting hours tracking

**Logic Inbound:**
- Charge per integration connection
- Charge per webhook execution
- Charge per opportunity
- Monthly subscription tier

### Usage Metrics

Track separately per organization:
- API calls
- Storage used
- Active users
- Feature usage
- Integration connections
- Webhook executions

---

## Implementation Notes for Lovable

### When Building Features

**Always Consider:**
1. **Organization Context:** Every feature must be organization-scoped
2. **Access Control:** Check user has access to the organization
3. **Data Isolation:** Never leak data between organizations
4. **Branding:** Use organization-specific colors/logos
5. **Feature Flags:** Some features are organization-exclusive (SitePanda SEO)

**Code Pattern:**
```typescript
// Always get organization from context
const orgSlug = getOrgFromContext(); // 'sitepanda', 'du', or 'logicinbound'

// Validate user access
if (!userHasAccessToOrg(user, orgSlug)) {
  return res.status(403).json({ error: 'Access denied' });
}

// Scope all queries
const clients = await db.query(
  'SELECT * FROM clients WHERE organization_id = $1',
  [organizationId]
);

// Check feature availability
if (feature === 'seo-research' && orgSlug !== 'sitepanda') {
  return res.status(403).json({ error: 'Feature not available' });
}
```

### Database Queries

**Always include organization filter:**
```sql
-- ❌ WRONG - No organization filter
SELECT * FROM clients WHERE email = 'test@example.com';

-- ✅ CORRECT - Organization-scoped
SELECT * FROM clients 
WHERE email = 'test@example.com' 
AND organization_id = $1;
```

### UI Components

**Organization-aware components:**
```typescript
// Get organization branding
const orgBranding = {
  sitepanda: { icon: '🐼', color: '#3b82f6', name: 'SitePanda' },
  du: { icon: '📊', color: '#1e40af', name: 'Decisions Unlimited' },
  logicinbound: { icon: '🎯', color: '#10b981', name: 'Logic Inbound' }
};

// Show/hide features based on organization
{orgSlug === 'sitepanda' && (
  <NavItem href="/sitepandaseo">🐼 SitePanda SEO</NavItem>
)}
```

---

## Summary

The Unified Operations Platform serves **three distinct business units** (SitePanda, Decisions Unlimited, and Logic Inbound) as separate organizations within a shared infrastructure. Each organization has:

- **Complete data isolation** (clients, projects, opportunities, etc.)
- **Custom branding** (colors, logos, domains)
- **Specific feature sets** (SitePanda has exclusive SEO tools)
- **Separate workflows** optimized for their business model
- **Independent billing** and usage tracking

Users like Kyle Roelofs can access all three organizations, while other team members may be restricted to one or more organizations based on their role. The platform provides a seamless experience for switching between organizations while maintaining strict data boundaries.

