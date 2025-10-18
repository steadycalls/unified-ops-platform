const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);
router.use(authorize('member'));

// Get organization ID helper
async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// List clients
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { status, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM clients WHERE organization_id = $1';
    const params = [orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR company_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM clients WHERE organization_id = $1',
      [orgId]
    );

    res.json({
      clients: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    
    const result = await db.query(
      'SELECT * FROM clients WHERE id = $1 AND organization_id = $2',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client
router.post('/', checkPermission('clients', 'create'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const {
      first_name, last_name, company_name, email, phone,
      address, city, state, zip_code, country,
      industry, website_url, linkedin_url, twitter_url, facebook_url,
      status, tags, custom_fields, notes
    } = req.body;

    const result = await db.query(`
      INSERT INTO clients (
        organization_id, first_name, last_name, company_name, email, phone,
        address, city, state, zip_code, country,
        industry, website_url, linkedin_url, twitter_url, facebook_url,
        status, tags, custom_fields, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      orgId, first_name, last_name, company_name, email, phone,
      address, city, state, zip_code, country || 'USA',
      industry, website_url, linkedin_url, twitter_url, facebook_url,
      status || 'active', tags, JSON.stringify(custom_fields || {}), notes
    ]);

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent)
      VALUES ($1, $2, 'created', 'client', $3, $4, $5)
    `, [req.user.id, orgId, result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.patch('/:id', checkPermission('clients', 'update'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, orgId);

    const result = await db.query(`
      UPDATE clients 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND organization_id = $${paramCount + 1}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent)
      VALUES ($1, $2, 'updated', 'client', $3, $4, $5, $6)
    `, [req.user.id, orgId, req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', checkPermission('clients', 'delete'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    
    const result = await db.query(
      'DELETE FROM clients WHERE id = $1 AND organization_id = $2 RETURNING id',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log activity
    await db.query(`
      INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent)
      VALUES ($1, $2, 'deleted', 'client', $3, $4, $5)
    `, [req.user.id, orgId, req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;

