-- Outgoing Webhooks Extension
-- Add this to your existing database

-- Outgoing webhooks (send events to external platforms)
CREATE TABLE IF NOT EXISTS outgoing_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_url TEXT NOT NULL,
  
  -- Configuration
  http_method VARCHAR(10) DEFAULT 'POST' CHECK (http_method IN ('POST', 'PUT', 'PATCH')),
  headers JSONB DEFAULT '{}',
  auth_type VARCHAR(50) CHECK (auth_type IN ('none', 'bearer', 'basic', 'api_key', 'custom')),
  auth_config JSONB DEFAULT '{}', -- Store credentials securely
  
  -- Event triggers
  event_types TEXT[] NOT NULL, -- e.g., ['client.created', 'project.updated', 'opportunity.won']
  event_filters JSONB DEFAULT '{}', -- Conditional filters
  
  -- Payload configuration
  payload_template JSONB, -- Custom payload structure
  include_metadata BOOLEAN DEFAULT TRUE,
  
  -- Retry configuration
  retry_enabled BOOLEAN DEFAULT TRUE,
  retry_attempts INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Status and monitoring
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  total_triggers INTEGER DEFAULT 0,
  successful_triggers INTEGER DEFAULT 0,
  failed_triggers INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outgoing_webhooks_org ON outgoing_webhooks(organization_id);
CREATE INDEX idx_outgoing_webhooks_active ON outgoing_webhooks(is_active);
CREATE INDEX idx_outgoing_webhooks_events ON outgoing_webhooks USING GIN(event_types);

-- Outgoing webhook delivery logs
CREATE TABLE IF NOT EXISTS outgoing_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outgoing_webhook_id UUID REFERENCES outgoing_webhooks(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_id UUID, -- Reference to the entity that triggered the event
  event_data JSONB,
  
  -- Request details
  request_url TEXT NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  
  -- Response details
  response_status_code INTEGER,
  response_headers JSONB,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Retry tracking
  attempt_number INTEGER DEFAULT 1,
  is_retry BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error_message TEXT,
  
  -- Timestamps
  triggered_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP
);

CREATE INDEX idx_outgoing_deliveries_webhook ON outgoing_webhook_deliveries(outgoing_webhook_id);
CREATE INDEX idx_outgoing_deliveries_org ON outgoing_webhook_deliveries(organization_id);
CREATE INDEX idx_outgoing_deliveries_status ON outgoing_webhook_deliveries(status);
CREATE INDEX idx_outgoing_deliveries_event ON outgoing_webhook_deliveries(event_type);
CREATE INDEX idx_outgoing_deliveries_triggered ON outgoing_webhook_deliveries(triggered_at);

-- Function to trigger outgoing webhooks
CREATE OR REPLACE FUNCTION trigger_outgoing_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_name TEXT;
  payload JSONB;
BEGIN
  -- Determine event name based on operation and table
  event_name := TG_TABLE_NAME || '.' || LOWER(TG_OP);
  
  -- Build payload
  IF TG_OP = 'DELETE' THEN
    payload := row_to_json(OLD)::JSONB;
  ELSE
    payload := row_to_json(NEW)::JSONB;
  END IF;
  
  -- Find matching active webhooks
  FOR webhook_record IN
    SELECT * FROM outgoing_webhooks 
    WHERE is_active = TRUE 
    AND organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND event_name = ANY(event_types)
  LOOP
    -- Insert delivery record (actual HTTP request will be processed by background worker)
    INSERT INTO outgoing_webhook_deliveries (
      outgoing_webhook_id,
      organization_id,
      event_type,
      event_id,
      event_data,
      request_url,
      request_method,
      status
    ) VALUES (
      webhook_record.id,
      COALESCE(NEW.organization_id, OLD.organization_id),
      event_name,
      COALESCE(NEW.id, OLD.id),
      payload,
      webhook_record.target_url,
      webhook_record.http_method,
      'pending'
    );
    
    -- Update webhook stats
    UPDATE outgoing_webhooks 
    SET 
      last_triggered_at = NOW(),
      total_triggers = total_triggers + 1
    WHERE id = webhook_record.id;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Example: Add triggers for clients table
CREATE TRIGGER trigger_clients_outgoing_webhooks
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION trigger_outgoing_webhooks();

-- Example: Add triggers for projects table
CREATE TRIGGER trigger_projects_outgoing_webhooks
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION trigger_outgoing_webhooks();

-- Example: Add triggers for opportunities table
CREATE TRIGGER trigger_opportunities_outgoing_webhooks
AFTER INSERT OR UPDATE OR DELETE ON opportunities
FOR EACH ROW EXECUTE FUNCTION trigger_outgoing_webhooks();

-- Example: Add triggers for notes table
CREATE TRIGGER trigger_notes_outgoing_webhooks
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW EXECUTE FUNCTION trigger_outgoing_webhooks();

-- Cleanup old delivery logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries()
RETURNS void AS $$
BEGIN
  DELETE FROM outgoing_webhook_deliveries 
  WHERE triggered_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE outgoing_webhooks IS 'Configuration for sending events to external platforms';
COMMENT ON TABLE outgoing_webhook_deliveries IS 'Log of all outgoing webhook delivery attempts';

