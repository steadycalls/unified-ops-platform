const express = require('express');
const router = express.Router({ mergeParams: true });
const axios = require('axios');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// List outgoing webhooks
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { is_active } = req.query;

    let query = 'SELECT * FROM outgoing_webhooks WHERE organization_id = $1';
    const params = [orgId];

    if (is_active !== undefined) {
      query += ' AND is_active = $2';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({ webhooks: result.rows });
  } catch (error) {
    console.error('List outgoing webhooks error:', error);
    res.status(500).json({ error: 'Failed to fetch outgoing webhooks' });
  }
});

// Get single outgoing webhook
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(
      'SELECT * FROM outgoing_webhooks WHERE id = $1 AND organization_id = $2',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outgoing webhook not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get outgoing webhook error:', error);
    res.status(500).json({ error: 'Failed to fetch outgoing webhook' });
  }
});

// Create outgoing webhook
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const {
      name,
      description,
      target_url,
      http_method,
      headers,
      auth_type,
      auth_config,
      event_types,
      event_filters,
      payload_template,
      include_metadata,
      retry_enabled,
      retry_attempts,
      retry_delay_seconds
    } = req.body;

    if (!name || !target_url || !event_types || event_types.length === 0) {
      return res.status(400).json({ error: 'name, target_url, and event_types are required' });
    }

    // Validate URL
    try {
      new URL(target_url);
    } catch {
      return res.status(400).json({ error: 'Invalid target_url' });
    }

    const result = await db.query(`
      INSERT INTO outgoing_webhooks (
        organization_id, name, description, target_url, http_method,
        headers, auth_type, auth_config, event_types, event_filters,
        payload_template, include_metadata, retry_enabled, retry_attempts,
        retry_delay_seconds, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      orgId, name, description, target_url, http_method || 'POST',
      JSON.stringify(headers || {}), auth_type || 'none',
      JSON.stringify(auth_config || {}), event_types,
      JSON.stringify(event_filters || {}), JSON.stringify(payload_template || null),
      include_metadata !== false, retry_enabled !== false,
      retry_attempts || 3, retry_delay_seconds || 60, req.user.id
    ]);

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'outgoing_webhook', result.rows[0].id, req.ip, req.headers['user-agent']]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create outgoing webhook error:', error);
    res.status(500).json({ error: 'Failed to create outgoing webhook' });
  }
});

// Update outgoing webhook
router.patch('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    const jsonFields = ['headers', 'auth_config', 'event_filters', 'payload_template'];

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at' && key !== 'created_by') {
        if (jsonFields.includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, orgId);
    const result = await db.query(
      `UPDATE outgoing_webhooks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outgoing webhook not found' });
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'outgoing_webhook', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update outgoing webhook error:', error);
    res.status(500).json({ error: 'Failed to update outgoing webhook' });
  }
});

// Test outgoing webhook
router.post('/:id/test', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(
      'SELECT * FROM outgoing_webhooks WHERE id = $1 AND organization_id = $2',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outgoing webhook not found' });
    }

    const webhook = result.rows[0];

    // Build test payload
    const testPayload = {
      event: 'test.triggered',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook_id: webhook.id,
        webhook_name: webhook.name
      }
    };

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'UnifiedOps-Webhook/2.0',
      ...webhook.headers
    };

    // Add authentication
    if (webhook.auth_type === 'bearer' && webhook.auth_config.token) {
      headers['Authorization'] = `Bearer ${webhook.auth_config.token}`;
    } else if (webhook.auth_type === 'api_key' && webhook.auth_config.key && webhook.auth_config.value) {
      headers[webhook.auth_config.key] = webhook.auth_config.value;
    } else if (webhook.auth_type === 'basic' && webhook.auth_config.username && webhook.auth_config.password) {
      const auth = Buffer.from(`${webhook.auth_config.username}:${webhook.auth_config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    // Send test request
    const startTime = Date.now();
    try {
      const response = await axios({
        method: webhook.http_method,
        url: webhook.target_url,
        headers,
        data: testPayload,
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      });

      const responseTime = Date.now() - startTime;

      // Log delivery
      await db.query(`
        INSERT INTO outgoing_webhook_deliveries (
          outgoing_webhook_id, organization_id, event_type, event_data,
          request_url, request_method, request_headers, request_body,
          response_status_code, response_headers, response_body, response_time_ms,
          status, delivered_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      `, [
        webhook.id, orgId, 'test.triggered', JSON.stringify(testPayload),
        webhook.target_url, webhook.http_method, JSON.stringify(headers),
        JSON.stringify(testPayload), response.status, JSON.stringify(response.headers),
        JSON.stringify(response.data).substring(0, 5000), responseTime,
        response.status >= 200 && response.status < 300 ? 'success' : 'failed'
      ]);

      res.json({
        success: response.status >= 200 && response.status < 300,
        status_code: response.status,
        response_time_ms: responseTime,
        response_body: response.data
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Log failed delivery
      await db.query(`
        INSERT INTO outgoing_webhook_deliveries (
          outgoing_webhook_id, organization_id, event_type, event_data,
          request_url, request_method, request_headers, request_body,
          response_time_ms, status, error_message, failed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        webhook.id, orgId, 'test.triggered', JSON.stringify(testPayload),
        webhook.target_url, webhook.http_method, JSON.stringify(headers),
        JSON.stringify(testPayload), responseTime, 'failed', error.message
      ]);

      res.status(500).json({
        success: false,
        error: error.message,
        response_time_ms: responseTime
      });
    }
  } catch (error) {
    console.error('Test outgoing webhook error:', error);
    res.status(500).json({ error: 'Failed to test outgoing webhook' });
  }
});

// Get delivery logs
router.get('/:id/deliveries', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { status, event_type, limit = 50, offset = 0 } = req.query;

    // Verify webhook belongs to organization
    const webhookResult = await db.query(
      'SELECT id FROM outgoing_webhooks WHERE id = $1 AND organization_id = $2',
      [req.params.id, orgId]
    );

    if (webhookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Outgoing webhook not found' });
    }

    let query = 'SELECT * FROM outgoing_webhook_deliveries WHERE outgoing_webhook_id = $1';
    const params = [req.params.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (event_type) {
      paramCount++;
      query += ` AND event_type = $${paramCount}`;
      params.push(event_type);
    }

    query += ` ORDER BY triggered_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query(
      'SELECT COUNT(*) FROM outgoing_webhook_deliveries WHERE outgoing_webhook_id = $1',
      [req.params.id]
    );

    res.json({
      deliveries: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Delete outgoing webhook
router.delete('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(
      'DELETE FROM outgoing_webhooks WHERE id = $1 AND organization_id = $2 RETURNING id',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outgoing webhook not found' });
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'outgoing_webhook', req.params.id, req.ip, req.headers['user-agent']]
    );

    res.json({ success: true, message: 'Outgoing webhook deleted successfully' });
  } catch (error) {
    console.error('Delete outgoing webhook error:', error);
    res.status(500).json({ error: 'Failed to delete outgoing webhook' });
  }
});

// Get available event types
router.get('/../event-types', async (req, res) => {
  try {
    const eventTypes = [
      { value: 'clients.created', label: 'Client Created', description: 'Triggered when a new client is created' },
      { value: 'clients.updated', label: 'Client Updated', description: 'Triggered when a client is updated' },
      { value: 'clients.deleted', label: 'Client Deleted', description: 'Triggered when a client is deleted' },
      { value: 'projects.created', label: 'Project Created', description: 'Triggered when a new project is created' },
      { value: 'projects.updated', label: 'Project Updated', description: 'Triggered when a project is updated' },
      { value: 'projects.deleted', label: 'Project Deleted', description: 'Triggered when a project is deleted' },
      { value: 'opportunities.created', label: 'Opportunity Created', description: 'Triggered when a new opportunity is created' },
      { value: 'opportunities.updated', label: 'Opportunity Updated', description: 'Triggered when an opportunity is updated' },
      { value: 'opportunities.deleted', label: 'Opportunity Deleted', description: 'Triggered when an opportunity is deleted' },
      { value: 'notes.created', label: 'Note Created', description: 'Triggered when a new note is created' },
      { value: 'notes.updated', label: 'Note Updated', description: 'Triggered when a note is updated' },
      { value: 'notes.deleted', label: 'Note Deleted', description: 'Triggered when a note is deleted' }
    ];

    res.json({ event_types: eventTypes });
  } catch (error) {
    console.error('Get event types error:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

module.exports = router;

