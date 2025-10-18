-- Unified Operations Platform Database Schema
-- Version: 2.0
-- PostgreSQL 14+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES: Users, Organizations, Permissions
-- ============================================================================

-- Users table (central authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Organizations (the three main branches)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(custom_domain);

-- Insert default organizations
INSERT INTO organizations (name, slug, custom_domain, primary_color, secondary_color) VALUES
('SitePanda', 'sitepanda', 'sitepandaseo.com', '#3B82F6', '#10B981'),
('Decisions Unlimited', 'du', 'ducrm.com', '#8B5CF6', '#EC4899'),
('Logic Inbound', 'li', 'my.logicinbound.com', '#F59E0B', '#EF4444');

-- User-Organization relationships (permissions)
CREATE TABLE user_organization_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_org_roles_user ON user_organization_roles(user_id);
CREATE INDEX idx_user_org_roles_org ON user_organization_roles(organization_id);

-- User sessions (for auth management)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  refresh_expires_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================================================
-- CORE MODULES: Clients, Projects, Opportunities
-- ============================================================================

-- Clients/Contacts table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  
  -- Business info
  industry VARCHAR(100),
  website_url TEXT,
  
  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  
  -- Status and metadata
  status VARCHAR(50) DEFAULT 'active',
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Scoring
  engagement_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company_name);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Project details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_type VARCHAR(100),
  
  -- Status and priority
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  health VARCHAR(50) DEFAULT 'on_track',
  
  -- Dates
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  
  -- Assignment and budget
  assigned_to UUID REFERENCES users(id),
  budget DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  
  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_assigned ON projects(assigned_to);
CREATE INDEX idx_projects_dates ON projects(start_date, due_date);

-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES clients(id),
  
  -- Opportunity details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Pipeline management
  stage VARCHAR(100) NOT NULL DEFAULT 'lead',
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Assignment
  owner_id UUID REFERENCES users(id),
  
  -- Source tracking
  source VARCHAR(100),
  source_metadata JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'open',
  lost_reason TEXT,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

-- ============================================================================
-- NOTES & KNOWLEDGE MANAGEMENT
-- ============================================================================

-- Files table (for attachments)
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  
  -- Entity association
  entity_type VARCHAR(100),
  entity_id UUID,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_org ON files(organization_id);
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  source VARCHAR(100) DEFAULT 'manual',
  source_metadata JSONB DEFAULT '{}',
  
  -- Relationships
  entity_type VARCHAR(100),
  entity_id UUID,
  
  -- File attachments
  has_attachment BOOLEAN DEFAULT FALSE,
  attachment_file_id UUID REFERENCES files(id),
  
  -- Organization
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_org ON notes(organization_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

-- ============================================================================
-- ORGANIZATION-SPECIFIC TABLES
-- ============================================================================

-- DU: RankDRE Sites
CREATE TABLE rankdre_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  domain VARCHAR(255) UNIQUE NOT NULL,
  niche VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(50),
  target_keywords TEXT[],
  
  duda_site_id VARCHAR(255),
  gmb_profile_id UUID,
  browser_profile_id VARCHAR(255),
  
  ranking_status VARCHAR(50) DEFAULT 'not_ranked',
  rental_status VARCHAR(50) DEFAULT 'available',
  monthly_rent_amount DECIMAL(10, 2),
  renter_id UUID REFERENCES clients(id),
  rental_start_date DATE,
  
  analytics_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rankdre_sites_project ON rankdre_sites(project_id);
CREATE INDEX idx_rankdre_sites_domain ON rankdre_sites(domain);
CREATE INDEX idx_rankdre_sites_status ON rankdre_sites(ranking_status, rental_status);

-- DU: GMB Profiles
CREATE TABLE gmb_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rankdre_site_id UUID REFERENCES rankdre_sites(id) ON DELETE CASCADE,
  
  business_name VARCHAR(255) NOT NULL,
  gmb_id VARCHAR(255) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  category VARCHAR(100),
  
  status VARCHAR(50) DEFAULT 'pending',
  verification_method VARCHAR(100),
  catalyst_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gmb_profiles_site ON gmb_profiles(rankdre_site_id);
CREATE INDEX idx_gmb_profiles_status ON gmb_profiles(status);

-- DU: Browser Profiles
CREATE TABLE browser_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  adspower_profile_id VARCHAR(255) UNIQUE NOT NULL,
  profile_name VARCHAR(255),
  email VARCHAR(255),
  associated_site_id UUID REFERENCES rankdre_sites(id),
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_browser_profiles_site ON browser_profiles(associated_site_id);

-- SitePanda: Websites
CREATE TABLE sitepanda_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  
  domain VARCHAR(255),
  duda_site_id VARCHAR(255) UNIQUE,
  template_id VARCHAR(100),
  industry VARCHAR(100),
  
  audit_score INTEGER,
  keyword_data JSONB DEFAULT '{}',
  serp_visibility JSONB DEFAULT '{}',
  
  status VARCHAR(50) DEFAULT 'draft',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sitepanda_websites_project ON sitepanda_websites(project_id);
CREATE INDEX idx_sitepanda_websites_client ON sitepanda_websites(client_id);

-- SitePanda: Keyword Research
CREATE TABLE keyword_research (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES sitepanda_websites(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  search_volume INTEGER,
  competition VARCHAR(50),
  cpc DECIMAL(10, 2),
  serp_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_keyword_research_website ON keyword_research(website_id);

-- Logic Inbound: Client Details
CREATE TABLE li_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  onboarding_status VARCHAR(50) DEFAULT 'pending',
  service_type VARCHAR(100),
  monthly_retainer DECIMAL(10, 2),
  contract_start_date DATE,
  contract_end_date DATE,
  account_manager_id UUID REFERENCES users(id),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_li_clients_client ON li_clients(client_id);
CREATE INDEX idx_li_clients_manager ON li_clients(account_manager_id);

-- Logic Inbound: Deliverables
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  li_client_id UUID REFERENCES li_clients(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deliverable_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  completed_date DATE,
  assigned_to UUID REFERENCES users(id),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deliverables_client ON deliverables(li_client_id);
CREATE INDEX idx_deliverables_assigned ON deliverables(assigned_to);
CREATE INDEX idx_deliverables_status ON deliverables(status);

-- Logic Inbound: KPI Metrics
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  li_client_id UUID REFERENCES li_clients(id) ON DELETE CASCADE,
  
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 2),
  metric_date DATE NOT NULL,
  source VARCHAR(100),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kpi_metrics_client ON kpi_metrics(li_client_id);
CREATE INDEX idx_kpi_metrics_date ON kpi_metrics(metric_date DESC);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

-- Integration configurations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  integration_type VARCHAR(100) NOT NULL,
  integration_name VARCHAR(255) NOT NULL,
  
  credentials JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  
  sync_direction VARCHAR(50) DEFAULT 'bidirectional',
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  
  is_active BOOLEAN DEFAULT TRUE,
  health_status VARCHAR(50) DEFAULT 'healthy',
  last_error TEXT,
  last_error_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_next_sync ON integrations(next_sync_at) WHERE auto_sync_enabled = TRUE;

-- Integration logs
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  log_level VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  
  request_data JSONB,
  response_data JSONB,
  
  duration_ms INTEGER,
  records_processed INTEGER,
  records_failed INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_id, created_at DESC);
CREATE INDEX idx_integration_logs_org ON integration_logs(organization_id, log_level, created_at DESC);
CREATE INDEX idx_integration_logs_expires ON integration_logs(expires_at);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  webhook_url VARCHAR(500) UNIQUE NOT NULL,
  webhook_secret VARCHAR(255) NOT NULL,
  
  webhook_type VARCHAR(100) NOT NULL,
  allowed_methods TEXT[] DEFAULT ARRAY['POST'],
  
  auto_process BOOLEAN DEFAULT TRUE,
  transform_script TEXT,
  
  target_entity VARCHAR(100),
  field_mapping JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX idx_webhooks_url ON webhooks(webhook_url);

-- Webhook requests
CREATE TABLE webhook_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  body JSONB,
  query_params JSONB,
  
  status VARCHAR(50) DEFAULT 'pending',
  processing_result JSONB,
  error_message TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_webhook_requests_webhook ON webhook_requests(webhook_id, received_at DESC);
CREATE INDEX idx_webhook_requests_status ON webhook_requests(status, received_at);

-- Calendar events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  google_event_id VARCHAR(255) UNIQUE NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location TEXT,
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone VARCHAR(100),
  is_all_day BOOLEAN DEFAULT FALSE,
  
  organizer_email VARCHAR(255),
  attendees JSONB DEFAULT '[]',
  associated_user_ids UUID[],
  
  entity_type VARCHAR(100),
  entity_id UUID,
  
  event_status VARCHAR(50) DEFAULT 'confirmed',
  last_synced_at TIMESTAMP DEFAULT NOW(),
  raw_data JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_users ON calendar_events USING GIN(associated_user_ids);

-- External project sync
CREATE TABLE external_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  internal_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  external_system VARCHAR(50) NOT NULL,
  external_project_id VARCHAR(255) NOT NULL,
  external_project_name VARCHAR(255),
  
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_tasks BOOLEAN DEFAULT TRUE,
  sync_messages BOOLEAN DEFAULT TRUE,
  sync_contacts BOOLEAN DEFAULT TRUE,
  
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending',
  external_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(external_system, external_project_id, organization_id)
);

CREATE INDEX idx_external_projects_internal ON external_projects(internal_project_id);
CREATE INDEX idx_external_projects_external ON external_projects(external_system, external_project_id);

-- External tasks sync
CREATE TABLE external_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  external_project_id UUID REFERENCES external_projects(id) ON DELETE CASCADE,
  internal_deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  
  external_system VARCHAR(50) NOT NULL,
  external_task_id VARCHAR(255) NOT NULL,
  
  task_name VARCHAR(500) NOT NULL,
  task_description TEXT,
  status VARCHAR(100),
  priority VARCHAR(50),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  
  assigned_to_external_id VARCHAR(255),
  assigned_to_user_id UUID REFERENCES users(id),
  
  last_synced_at TIMESTAMP DEFAULT NOW(),
  external_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(external_system, external_task_id, organization_id)
);

CREATE INDEX idx_external_tasks_project ON external_tasks(external_project_id);

-- GHL contact sync
CREATE TABLE ghl_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  internal_contact_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  ghl_contact_id VARCHAR(255) NOT NULL,
  ghl_location_id VARCHAR(255) NOT NULL,
  
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_direction VARCHAR(50) DEFAULT 'bidirectional',
  
  last_synced_at TIMESTAMP,
  last_sync_direction VARCHAR(50),
  sync_conflicts JSONB DEFAULT '[]',
  ghl_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ghl_contact_id, organization_id)
);

CREATE INDEX idx_ghl_contacts_internal ON ghl_contacts(internal_contact_id);
CREATE INDEX idx_ghl_contacts_ghl ON ghl_contacts(ghl_contact_id);

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_org ON activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    DELETE FROM webhook_requests WHERE expires_at < NOW();
    DELETE FROM integration_logs WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default admin user (password: Admin123!)
INSERT INTO users (email, password_hash, full_name, is_super_admin, is_active) VALUES
('admin@unified-ops.com', '$2a$10$rQ8YvkPJZ5L5h5K5h5K5h5K5h5K5h5K5h5K5h5K5h5K5h5K5h5K5', 'System Administrator', TRUE, TRUE);

-- Grant admin access to all organizations
INSERT INTO user_organization_roles (user_id, organization_id, role, permissions)
SELECT 
    (SELECT id FROM users WHERE email = 'admin@unified-ops.com'),
    id,
    'admin',
    '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "projects": {"create": true, "read": true, "update": true, "delete": true}, "settings": {"manage": true}}'::jsonb
FROM organizations;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: User organizations with role
CREATE OR REPLACE VIEW user_organizations AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    uor.role,
    uor.permissions
FROM users u
JOIN user_organization_roles uor ON u.id = uor.user_id
JOIN organizations o ON uor.organization_id = o.id
WHERE u.is_active = TRUE AND o.is_active = TRUE;

-- View: Project summary
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.priority,
    o.name as organization_name,
    c.company_name as client_name,
    u.full_name as assigned_to_name,
    p.start_date,
    p.due_date,
    p.budget,
    p.actual_cost
FROM projects p
JOIN organizations o ON p.organization_id = o.id
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN users u ON p.assigned_to = u.id;

-- View: Opportunity pipeline
CREATE OR REPLACE VIEW opportunity_pipeline AS
SELECT 
    o.id,
    o.name,
    o.value,
    o.stage,
    o.probability,
    o.expected_close_date,
    org.name as organization_name,
    c.company_name as contact_company,
    u.full_name as owner_name
FROM opportunities o
JOIN organizations org ON o.organization_id = org.id
LEFT JOIN clients c ON o.contact_id = c.id
LEFT JOIN users u ON o.owner_id = u.id
WHERE o.status = 'open';

COMMENT ON DATABASE postgres IS 'Unified Operations Platform Database - Multi-tenant system for DU, SitePanda, and Logic Inbound';

