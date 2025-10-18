-- SOP/Documentation System
-- Blog-style interface for SOPs and documentation

-- Categories for organizing SOPs
CREATE TABLE IF NOT EXISTS sop_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- emoji or icon name
  color VARCHAR(7) DEFAULT '#3B82F6',
  parent_id UUID REFERENCES sop_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_sop_categories_org ON sop_categories(organization_id);
CREATE INDEX idx_sop_categories_slug ON sop_categories(organization_id, slug);
CREATE INDEX idx_sop_categories_parent ON sop_categories(parent_id);

-- Tags for flexible categorization
CREATE TABLE IF NOT EXISTS sop_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_sop_tags_org ON sop_tags(organization_id);
CREATE INDEX idx_sop_tags_slug ON sop_tags(organization_id, slug);

-- SOP/Documentation pages
CREATE TABLE IF NOT EXISTS sop_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES sop_categories(id) ON DELETE SET NULL,
  
  -- Basic info
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'html', 'rich_text')),
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Visibility
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  password_protected BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES sop_pages(id) ON DELETE SET NULL,
  
  -- Media
  featured_image_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  
  -- Collaboration
  author_id UUID REFERENCES users(id),
  last_edited_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_sop_pages_org ON sop_pages(organization_id);
CREATE INDEX idx_sop_pages_slug ON sop_pages(organization_id, slug);
CREATE INDEX idx_sop_pages_category ON sop_pages(category_id);
CREATE INDEX idx_sop_pages_visibility ON sop_pages(visibility);
CREATE INDEX idx_sop_pages_status ON sop_pages(status);
CREATE INDEX idx_sop_pages_published ON sop_pages(published_at);
CREATE INDEX idx_sop_pages_author ON sop_pages(author_id);

-- Full-text search index
CREATE INDEX idx_sop_pages_search ON sop_pages USING gin(to_tsvector('english', title || ' ' || coalesce(excerpt, '') || ' ' || content));

-- Page-Tag relationships
CREATE TABLE IF NOT EXISTS sop_page_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES sop_pages(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES sop_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(page_id, tag_id)
);

CREATE INDEX idx_sop_page_tags_page ON sop_page_tags(page_id);
CREATE INDEX idx_sop_page_tags_tag ON sop_page_tags(tag_id);

-- Page views tracking
CREATE TABLE IF NOT EXISTS sop_page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES sop_pages(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sop_page_views_page ON sop_page_views(page_id);
CREATE INDEX idx_sop_page_views_org ON sop_page_views(organization_id);
CREATE INDEX idx_sop_page_views_date ON sop_page_views(viewed_at);

-- Page comments (optional for collaboration)
CREATE TABLE IF NOT EXISTS sop_page_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES sop_pages(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES sop_page_comments(id) ON DELETE CASCADE,
  
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sop_comments_page ON sop_page_comments(page_id);
CREATE INDEX idx_sop_comments_user ON sop_page_comments(user_id);
CREATE INDEX idx_sop_comments_parent ON sop_page_comments(parent_comment_id);

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sop_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sop_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
AFTER INSERT OR DELETE ON sop_page_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_sop_slug(title TEXT, org_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug format
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM sop_pages WHERE organization_id = org_id AND slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_sop_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sop_pages 
  SET view_count = view_count + 1, last_viewed_at = NEW.viewed_at
  WHERE id = NEW.page_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_view_count
AFTER INSERT ON sop_page_views
FOR EACH ROW EXECUTE FUNCTION increment_sop_view_count();

-- Insert default categories for each organization
INSERT INTO sop_categories (organization_id, name, slug, description, icon, color)
SELECT 
  o.id,
  'Getting Started',
  'getting-started',
  'Essential guides for new team members',
  '🚀',
  '#3B82F6'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sop_categories WHERE organization_id = o.id AND slug = 'getting-started'
);

INSERT INTO sop_categories (organization_id, name, slug, description, icon, color)
SELECT 
  o.id,
  'Processes',
  'processes',
  'Standard operating procedures and workflows',
  '⚙️',
  '#10B981'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sop_categories WHERE organization_id = o.id AND slug = 'processes'
);

INSERT INTO sop_categories (organization_id, name, slug, description, icon, color)
SELECT 
  o.id,
  'Documentation',
  'documentation',
  'Technical documentation and guides',
  '📚',
  '#8B5CF6'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sop_categories WHERE organization_id = o.id AND slug = 'documentation'
);

INSERT INTO sop_categories (organization_id, name, slug, description, icon, color)
SELECT 
  o.id,
  'Training',
  'training',
  'Training materials and resources',
  '🎓',
  '#F59E0B'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sop_categories WHERE organization_id = o.id AND slug = 'training'
);

-- Create example SOP for each organization
INSERT INTO sop_pages (organization_id, category_id, title, slug, excerpt, content, visibility, status, published_at, author_id)
SELECT 
  o.id,
  (SELECT id FROM sop_categories WHERE organization_id = o.id AND slug = 'getting-started' LIMIT 1),
  'Welcome to ' || o.name,
  'welcome',
  'Learn about our team, processes, and how to get started.',
  '# Welcome to ' || o.name || E'\n\n' ||
  'This is your central hub for all SOPs, documentation, and training materials.' || E'\n\n' ||
  '## Quick Links' || E'\n\n' ||
  '- [Getting Started](#getting-started)' || E'\n' ||
  '- [Processes](#processes)' || E'\n' ||
  '- [Documentation](#documentation)' || E'\n\n' ||
  '## Getting Started' || E'\n\n' ||
  'Start here to learn the basics and get up to speed quickly.' || E'\n\n' ||
  '## Need Help?' || E'\n\n' ||
  'Contact your team lead or check the documentation section.',
  'public',
  'published',
  NOW(),
  (SELECT id FROM users WHERE is_super_admin = TRUE LIMIT 1)
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM sop_pages WHERE organization_id = o.id AND slug = 'welcome'
);

COMMENT ON TABLE sop_categories IS 'Categories for organizing SOPs and documentation';
COMMENT ON TABLE sop_tags IS 'Tags for flexible categorization of SOP pages';
COMMENT ON TABLE sop_pages IS 'SOP and documentation pages with public/private visibility';
COMMENT ON TABLE sop_page_tags IS 'Many-to-many relationship between pages and tags';
COMMENT ON TABLE sop_page_views IS 'Analytics tracking for page views';
COMMENT ON TABLE sop_page_comments IS 'Comments and discussions on SOP pages';

