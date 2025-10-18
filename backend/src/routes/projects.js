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

// List projects
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT p.*, c.company_name as client_name, u.full_name as assigned_to_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id LEFT JOIN users u ON p.assigned_to = u.id WHERE p.organization_id = $1';
    const params = [orgId];

    if (status) {
      query += ' AND p.status = $2';
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM projects WHERE organization_id = $1', [orgId]);

    res.json({
      projects: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('SELECT * FROM projects WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', checkPermission('projects', 'create'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { name, description, project_type, status, priority, start_date, due_date, client_id, assigned_to, budget, tags, custom_fields } = req.body;

    const result = await db.query(`
      INSERT INTO projects (organization_id, name, description, project_type, status, priority, start_date, due_date, client_id, assigned_to, budget, tags, custom_fields)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [orgId, name, description, project_type, status || 'pending', priority || 'medium', start_date, due_date, client_id, assigned_to, budget, tags, JSON.stringify(custom_fields || {})]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'project', result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.patch('/:id', checkPermission('projects', 'update'), async (req, res) => {
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

    const result = await db.query(`UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'project', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', checkPermission('projects', 'delete'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query('DELETE FROM projects WHERE id = $1 AND organization_id = $2 RETURNING id', [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'project', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;

