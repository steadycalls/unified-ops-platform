const express = require('express');
const router = express.Router({ mergeParams: true });
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

function generateWebhookSecret() {
  return 'whsec_' + crypto.randomBytes(32).toString('hex');
}

function generateWebhookUrl(webhookId) {
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://sitepandaseo.com';
  return `${baseUrl}/webhook/${webhookId}`;
}

// List webhooks
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { webhook_type, is_active } = req.query;

    let query = 'SELECT * FROM webhooks WHERE organization_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (webhook_type) {
      paramCount++;
      query += ` AND webhook_type = $${paramCount}`;
      params.push(webhook_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({ webhooks: result.rows });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Get single webhook
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get webhook error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// Create webhook
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { name, description, webhook_type, allowed_methods, auto_process, transform_script, target_entity, field_mapping } = req.body;

    if (!name || !webhook_type) {
      return res.status(400).json({ error: 'name and webhook_type are required' });
    }

    const webhookSecret = generateWebhookSecret();
    const webhookId = crypto.randomUUID();
    const webhookUrl = generateWebhookUrl(webhookId);

    const result = await db.query(`
      INSERT INTO webhooks (id, organization_id, name, description, webhook_url, webhook_secret, webhook_type, allowed_methods, auto_process, transform_script, target_entity, field_mapping)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [webhookId, orgId, name, description, webhookUrl, webhookSecret, webhook_type, allowed_methods || ['POST'], auto_process !== false, transform_script, target_entity, JSON.stringify(field_mapping || {})]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'webhook', result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Update webhook
router.patch('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'webhook_url' && key !== 'webhook_secret' && key !== 'created_at') {
        if (key === 'field_mapping') {
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
    const result = await db.query(`UPDATE webhooks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'webhook', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Regenerate webhook secret
router.post('/:id/regenerate-secret', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const newSecret = generateWebhookSecret();

    const result = await db.query('UPDATE webhooks SET webhook_secret = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3 RETURNING *',
      [newSecret, req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'regenerated_secret', 'webhook', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ webhook_secret: newSecret });
  } catch (error) {
    console.error('Regenerate secret error:', error);
    res.status(500).json({ error: 'Failed to regenerate secret' });
  }
});

// Get webhook requests
router.get('/:id/requests', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { status, limit = 50, offset = 0 } = req.query;

    // Verify webhook belongs to organization
    const webhookResult = await db.query('SELECT id FROM webhooks WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    if (webhookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    let query = 'SELECT * FROM webhook_requests WHERE webhook_id = $1';
    const params = [req.params.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY received_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM webhook_requests WHERE webhook_id = $1', [req.params.id]);

    res.json({
      requests: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get webhook requests error:', error);
    res.status(500).json({ error: 'Failed to fetch webhook requests' });
  }
});

// Send test payload to webhook
router.post('/:id/test', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const webhook = result.rows[0];
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id,
      webhook_type: webhook.webhook_type,
      data: {
        title: 'Test Note',
        content: 'This is a test webhook payload',
        tags: ['test']
      }
    };

    // Create test webhook request
    await db.query(`
      INSERT INTO webhook_requests (webhook_id, method, headers, body, status, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [webhook.id, 'POST', JSON.stringify({ 'content-type': 'application/json' }), JSON.stringify(testPayload), 'processed', req.ip, 'Test Request']);

    res.json({
      success: true,
      message: 'Test payload sent successfully',
      payload: testPayload,
      webhook_url: webhook.webhook_url
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// Get webhook documentation
router.get('/:id/docs', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM webhooks WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const webhook = result.rows[0];

    const documentation = {
      webhook_id: webhook.id,
      webhook_url: webhook.webhook_url,
      webhook_type: webhook.webhook_type,
      allowed_methods: webhook.allowed_methods,
      authentication: {
        type: 'HMAC-SHA256',
        header: 'X-Webhook-Signature',
        secret: webhook.webhook_secret.substring(0, 15) + '...',
        instructions: 'Include HMAC-SHA256 signature of request body in X-Webhook-Signature header'
      },
      request_format: {
        content_type: 'application/json',
        example_payload: webhook.webhook_type === 'notes' ? {
          title: 'Note title',
          content: 'Note content',
          tags: ['tag1', 'tag2'],
          entity_type: 'contact',
          entity_id: 'uuid-here'
        } : {}
      },
      response_codes: {
        200: 'Success - Webhook processed',
        400: 'Bad Request - Invalid payload',
        401: 'Unauthorized - Invalid signature',
        500: 'Server Error - Processing failed'
      },
      curl_example: `curl -X POST ${webhook.webhook_url} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: your_signature_here" \\
  -d '{"title":"Test","content":"Test content"}'`
    };

    res.json(documentation);
  } catch (error) {
    console.error('Get webhook docs error:', error);
    res.status(500).json({ error: 'Failed to fetch documentation' });
  }
});

// Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('DELETE FROM webhooks WHERE id = $1 AND organization_id = $2 RETURNING id', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'webhook', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

module.exports = router;

