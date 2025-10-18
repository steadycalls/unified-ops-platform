const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('member'));

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// List opportunities
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { status, stage, owner_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT o.*, 
             c.company_name as contact_company, 
             c.first_name as contact_first_name,
             c.last_name as contact_last_name,
             u.full_name as owner_name
      FROM opportunities o
      LEFT JOIN clients c ON o.contact_id = c.id
      LEFT JOIN users u ON o.owner_id = u.id
      WHERE o.organization_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (stage) {
      paramCount++;
      query += ` AND o.stage = $${paramCount}`;
      params.push(stage);
    }

    if (owner_id) {
      paramCount++;
      query += ` AND o.owner_id = $${paramCount}`;
      params.push(owner_id);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM opportunities WHERE organization_id = $1', [orgId]);

    res.json({
      opportunities: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Get pipeline view
router.get('/pipeline', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);

    const result = await db.query(`
      SELECT 
        stage,
        COUNT(*) as count,
        SUM(value) as total_value,
        AVG(probability) as avg_probability
      FROM opportunities
      WHERE organization_id = $1 AND status = 'open'
      GROUP BY stage
      ORDER BY 
        CASE stage
          WHEN 'lead' THEN 1
          WHEN 'qualified' THEN 2
          WHEN 'proposal' THEN 3
          WHEN 'negotiation' THEN 4
          ELSE 5
        END
    `, [orgId]);

    res.json({ pipeline: result.rows });
  } catch (error) {
    console.error('Pipeline view error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);

    const pipelineValue = await db.query('SELECT SUM(value) as total FROM opportunities WHERE organization_id = $1 AND status = $2', [orgId, 'open']);
    const winRate = await db.query(`SELECT COUNT(CASE WHEN status = 'won' THEN 1 END)::float / NULLIF(COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END), 0) * 100 as win_rate FROM opportunities WHERE organization_id = $1`, [orgId]);
    const avgDealSize = await db.query('SELECT AVG(value) as avg_size FROM opportunities WHERE organization_id = $1 AND status = $2', [orgId, 'won']);
    const forecast = await db.query('SELECT SUM(value * probability / 100) as forecasted_revenue FROM opportunities WHERE organization_id = $1 AND status = $2', [orgId, 'open']);

    res.json({
      pipeline_value: parseFloat(pipelineValue.rows[0].total || 0),
      win_rate: parseFloat(winRate.rows[0].win_rate || 0),
      avg_deal_size: parseFloat(avgDealSize.rows[0].avg_size || 0),
      forecasted_revenue: parseFloat(forecast.rows[0].forecasted_revenue || 0)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(`SELECT o.*, c.company_name as contact_company, u.full_name as owner_name FROM opportunities o LEFT JOIN clients c ON o.contact_id = c.id LEFT JOIN users u ON o.owner_id = u.id WHERE o.id = $1 AND o.organization_id = $2`, [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// Create opportunity
router.post('/', checkPermission('opportunities', 'create'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { name, description, value, currency, stage, probability, expected_close_date, contact_id, owner_id, source, source_metadata, custom_fields, tags } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Opportunity name is required' });
    }

    const result = await db.query(`
      INSERT INTO opportunities (organization_id, contact_id, name, description, value, currency, stage, probability, expected_close_date, owner_id, source, source_metadata, custom_fields, tags, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [orgId, contact_id, name, description, value, currency || 'USD', stage || 'lead', probability || 0, expected_close_date, owner_id || req.user.id, source, JSON.stringify(source_metadata || {}), JSON.stringify(custom_fields || {}), tags, 'open']);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'opportunity', result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity
router.patch('/:id', checkPermission('opportunities', 'update'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
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
    const result = await db.query(`UPDATE opportunities SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'opportunity', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Delete opportunity
router.delete('/:id', checkPermission('opportunities', 'delete'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('DELETE FROM opportunities WHERE id = $1 AND organization_id = $2 RETURNING id', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'opportunity', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

module.exports = router;

