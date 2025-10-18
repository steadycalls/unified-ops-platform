# Unified Operations Platform - Complete Description

## Executive Summary

The **Unified Operations Platform** is a multi-tenant SaaS application designed to streamline business operations, client management, project tracking, and SEO services. Built with a modern tech stack (Next.js 14, Node.js, PostgreSQL), it features a professional dark navy UI inspired by DUFulfill and includes integrated SEO research tools from SitePanda.

---

## Platform Overview

### Purpose
Centralized operations management platform for agencies and businesses to:
- Manage clients and contacts
- Track projects and opportunities
- Document processes with SOPs
- Integrate with external tools via webhooks
- Conduct SEO keyword research and competitor analysis
- Generate AI-powered content for websites

### Target Users
- Digital marketing agencies
- Web development firms
- SEO consultants
- Business operations teams
- Multi-location service businesses

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

### 1. Authentication & Multi-Tenancy

**Login System:**
- Email/password authentication
- JWT token generation (access + refresh tokens)
- Secure password hashing with bcrypt
- Organization-based branding support
- Session persistence with localStorage

**Multi-Tenant Architecture:**
- Organization-level data isolation
- Role-based access control (admin, member, viewer)
- User can belong to multiple organizations
- Organization slug-based routing
- Tenant-specific branding (logo, colors)

**User Roles:**
- **Admin:** Full access to organization data
- **Member:** Standard user access
- **Viewer:** Read-only access

---

### 2. Dashboard

**Overview Stats:**
- Total Clients count
- Active Projects count
- Opportunities pipeline
- Revenue Pipeline value

**Organizations Section:**
- Grid view of user's organizations
- Organization name, role, and domain
- "Open Organization" button with direct links
- Active status badges

**Quick Actions Grid:**
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

Integrated SEO research and content generation tools from the SitePanda platform.

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

