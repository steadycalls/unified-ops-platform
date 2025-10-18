-- Performance Indexes for Unified Ops Platform
-- Run this after initial schema setup to improve query performance

-- ============================================
-- User Sessions Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at 
ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_expires_at 
ON user_sessions(refresh_expires_at);

-- ============================================
-- Activity Logs Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
ON activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id 
ON activity_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_org 
ON activity_logs(user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity 
ON activity_logs(entity_type, entity_id);

-- ============================================
-- Clients Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_organization_id 
ON clients(organization_id);

CREATE INDEX IF NOT EXISTS idx_clients_org_status 
ON clients(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_created_at 
ON clients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_email 
ON clients(email);

-- Full-text search on clients
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON clients USING gin(to_tsvector('english', 
  coalesce(name, '') || ' ' || 
  coalesce(email, '') || ' ' || 
  coalesce(company, '')
));

-- ============================================
-- Projects Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_organization_id 
ON projects(organization_id);

CREATE INDEX IF NOT EXISTS idx_projects_client_id 
ON projects(client_id);

CREATE INDEX IF NOT EXISTS idx_projects_org_status 
ON projects(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_due_date 
ON projects(due_date);

-- Full-text search on projects
CREATE INDEX IF NOT EXISTS idx_projects_search 
ON projects USING gin(to_tsvector('english', 
  coalesce(name, '') || ' ' || 
  coalesce(description, '')
));

-- ============================================
-- Opportunities Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id 
ON opportunities(organization_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_client_id 
ON opportunities(client_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_org_stage 
ON opportunities(organization_id, stage);

CREATE INDEX IF NOT EXISTS idx_opportunities_created_at 
ON opportunities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date 
ON opportunities(expected_close_date);

-- Full-text search on opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_search 
ON opportunities USING gin(to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(description, '')
));

-- ============================================
-- Notes Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notes_organization_id 
ON notes(organization_id);

CREATE INDEX IF NOT EXISTS idx_notes_created_by 
ON notes(created_by);

CREATE INDEX IF NOT EXISTS idx_notes_entity 
ON notes(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notes_created_at 
ON notes(created_at DESC);

-- Full-text search on notes
CREATE INDEX IF NOT EXISTS idx_notes_search 
ON notes USING gin(to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(content, '')
));

-- ============================================
-- Integrations Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_integrations_organization_id 
ON integrations(organization_id);

CREATE INDEX IF NOT EXISTS idx_integrations_type 
ON integrations(integration_type);

CREATE INDEX IF NOT EXISTS idx_integrations_org_type 
ON integrations(organization_id, integration_type);

CREATE INDEX IF NOT EXISTS idx_integrations_is_active 
ON integrations(is_active);

-- ============================================
-- Integration Logs Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id 
ON integration_logs(integration_id);

CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at 
ON integration_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_logs_status 
ON integration_logs(status);

-- ============================================
-- Webhooks Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_webhooks_organization_id 
ON webhooks(organization_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_is_active 
ON webhooks(is_active);

-- ============================================
-- Outgoing Webhooks Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_organization_id 
ON outgoing_webhooks(organization_id);

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_is_active 
ON outgoing_webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_event_types 
ON outgoing_webhooks USING gin(event_types);

-- ============================================
-- Outgoing Webhook Deliveries Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id 
ON outgoing_webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status 
ON outgoing_webhook_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_triggered_at 
ON outgoing_webhook_deliveries(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending 
ON outgoing_webhook_deliveries(triggered_at) 
WHERE status = 'pending';

-- ============================================
-- SOP Categories Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sop_categories_organization_id 
ON sop_categories(organization_id);

CREATE INDEX IF NOT EXISTS idx_sop_categories_parent_id 
ON sop_categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_sop_categories_slug 
ON sop_categories(organization_id, slug);

-- ============================================
-- SOP Tags Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sop_tags_organization_id 
ON sop_tags(organization_id);

CREATE INDEX IF NOT EXISTS idx_sop_tags_slug 
ON sop_tags(organization_id, slug);

-- ============================================
-- SOP Pages Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sop_pages_organization_id 
ON sop_pages(organization_id);

CREATE INDEX IF NOT EXISTS idx_sop_pages_category_id 
ON sop_pages(category_id);

CREATE INDEX IF NOT EXISTS idx_sop_pages_author_id 
ON sop_pages(author_id);

CREATE INDEX IF NOT EXISTS idx_sop_pages_slug 
ON sop_pages(organization_id, slug);

CREATE INDEX IF NOT EXISTS idx_sop_pages_status 
ON sop_pages(status);

CREATE INDEX IF NOT EXISTS idx_sop_pages_visibility 
ON sop_pages(visibility);

CREATE INDEX IF NOT EXISTS idx_sop_pages_public 
ON sop_pages(organization_id, visibility, status) 
WHERE visibility = 'public' AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_sop_pages_created_at 
ON sop_pages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sop_pages_published_at 
ON sop_pages(published_at DESC);

-- Full-text search on SOP pages
CREATE INDEX IF NOT EXISTS idx_sop_pages_search 
ON sop_pages USING gin(to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(excerpt, '') || ' ' || 
  coalesce(content, '')
));

-- ============================================
-- SOP Page Tags Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sop_page_tags_page_id 
ON sop_page_tags(page_id);

CREATE INDEX IF NOT EXISTS idx_sop_page_tags_tag_id 
ON sop_page_tags(tag_id);

-- ============================================
-- SOP Page Views Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sop_page_views_page_id 
ON sop_page_views(page_id);

CREATE INDEX IF NOT EXISTS idx_sop_page_views_user_id 
ON sop_page_views(user_id);

CREATE INDEX IF NOT EXISTS idx_sop_page_views_viewed_at 
ON sop_page_views(viewed_at DESC);

-- ============================================
-- Error Logs Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id 
ON error_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_organization_id 
ON error_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at 
ON error_logs(created_at DESC);

-- ============================================
-- User Organization Roles Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_id 
ON user_organization_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_org_roles_organization_id 
ON user_organization_roles(organization_id);

CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_org 
ON user_organization_roles(user_id, organization_id);

-- ============================================
-- Organizations Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug 
ON organizations(slug);

CREATE INDEX IF NOT EXISTS idx_organizations_is_active 
ON organizations(is_active);

-- ============================================
-- Users Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active);

-- ============================================
-- Analyze Tables for Query Planner
-- ============================================

ANALYZE users;
ANALYZE organizations;
ANALYZE user_organization_roles;
ANALYZE user_sessions;
ANALYZE activity_logs;
ANALYZE clients;
ANALYZE projects;
ANALYZE opportunities;
ANALYZE notes;
ANALYZE integrations;
ANALYZE integration_logs;
ANALYZE webhooks;
ANALYZE outgoing_webhooks;
ANALYZE outgoing_webhook_deliveries;
ANALYZE sop_categories;
ANALYZE sop_tags;
ANALYZE sop_pages;
ANALYZE sop_page_tags;
ANALYZE sop_page_views;
ANALYZE error_logs;

-- ============================================
-- Completion Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created successfully!';
  RAISE NOTICE 'Total indexes: ~60';
  RAISE NOTICE 'Tables analyzed for query optimization';
END $$;

