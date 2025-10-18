const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// List integrations
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { integration_type, is_active } = req.query;

    let query = 'SELECT id, organization_id, integration_type, integration_name, sync_direction, auto_sync_enabled, sync_interval_minutes, last_sync_at, next_sync_at, is_active, health_status, last_error_at, created_at, updated_at FROM integrations WHERE organization_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (integration_type) {
      paramCount++;
      query += ` AND integration_type = $${paramCount}`;
      params.push(integration_type);
    }

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json({ integrations: result.rows });
  } catch (error) {
    console.error('List integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Get single integration
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT id, organization_id, integration_type, integration_name, config, sync_direction, auto_sync_enabled, sync_interval_minutes, last_sync_at, next_sync_at, is_active, health_status, last_error, last_error_at, created_at, updated_at FROM integrations WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get integration error:', error);
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
});

// Create integration
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { integration_type, integration_name, credentials, config, sync_direction, auto_sync_enabled, sync_interval_minutes } = req.body;

    if (!integration_type || !integration_name || !credentials) {
      return res.status(400).json({ error: 'integration_type, integration_name, and credentials are required' });
    }

    const result = await db.query(`
      INSERT INTO integrations (organization_id, integration_type, integration_name, credentials, config, sync_direction, auto_sync_enabled, sync_interval_minutes, next_sync_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '1 minute' * $8)
      RETURNING id, organization_id, integration_type, integration_name, config, sync_direction, auto_sync_enabled, sync_interval_minutes, is_active, health_status, created_at
    `, [orgId, integration_type, integration_name, JSON.stringify(credentials), JSON.stringify(config || {}), sync_direction || 'bidirectional', auto_sync_enabled !== false, sync_interval_minutes || 15]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'integration', result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// Update integration
router.patch('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at') {
        if (key === 'credentials' || key === 'config') {
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
    const result = await db.query(`UPDATE integrations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING id, organization_id, integration_type, integration_name, config, sync_direction, auto_sync_enabled, sync_interval_minutes, is_active, health_status, updated_at`, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'integration', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
});

// Test integration connection
router.post('/:id/test', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM integrations WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Log test attempt
    await db.query(`INSERT INTO integration_logs (integration_id, organization_id, log_level, action, message) VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, orgId, 'info', 'test_connection', 'Connection test initiated']);

    res.json({ success: true, message: 'Connection test initiated. Check logs for results.' });
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

// Trigger manual sync
router.post('/:id/sync', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM integrations WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(400).json({ error: 'Integration is not active' });
    }

    // Update last sync time
    await db.query('UPDATE integrations SET last_sync_at = NOW(), next_sync_at = NOW() + INTERVAL \'1 minute\' * sync_interval_minutes WHERE id = $1', [req.params.id]);

    // Log sync
    await db.query(`INSERT INTO integration_logs (integration_id, organization_id, log_level, action, message) VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, orgId, 'info', 'manual_sync', 'Manual sync triggered']);

    res.json({ success: true, message: 'Sync triggered successfully' });
  } catch (error) {
    console.error('Sync integration error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// Get integration logs
router.get('/:id/logs', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { log_level, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM integration_logs WHERE integration_id = $1';
    const params = [req.params.id];
    let paramCount = 1;

    if (log_level) {
      paramCount++;
      query += ` AND log_level = $${paramCount}`;
      params.push(log_level);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM integration_logs WHERE integration_id = $1', [req.params.id]);

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get integration logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Delete integration
router.delete('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('DELETE FROM integrations WHERE id = $1 AND organization_id = $2 RETURNING id', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'integration', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});

// Get all integration logs (organization-wide)
router.get('/../integration-logs', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { integration_type, log_level, from, to, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT il.*, i.integration_type, i.integration_name
      FROM integration_logs il
      JOIN integrations i ON il.integration_id = i.id
      WHERE il.organization_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (integration_type) {
      paramCount++;
      query += ` AND i.integration_type = $${paramCount}`;
      params.push(integration_type);
    }

    if (log_level) {
      paramCount++;
      query += ` AND il.log_level = $${paramCount}`;
      params.push(log_level);
    }

    if (from) {
      paramCount++;
      query += ` AND il.created_at >= $${paramCount}`;
      params.push(from);
    }

    if (to) {
      paramCount++;
      query += ` AND il.created_at <= $${paramCount}`;
      params.push(to);
    }

    query += ` ORDER BY il.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM integration_logs WHERE organization_id = $1', [orgId]);

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get all integration logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;

