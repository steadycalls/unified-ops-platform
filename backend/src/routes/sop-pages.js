const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// Public routes (no auth required)
router.get('/public', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { category, tag, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             u.full_name as author_name,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM sop_pages p
      LEFT JOIN sop_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN sop_page_tags pt ON p.id = pt.page_id
      LEFT JOIN sop_tags t ON pt.tag_id = t.id
      WHERE p.organization_id = $1 AND p.visibility = 'public' AND p.status = 'published'
    `;
    const params = [orgId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND c.slug = $${paramCount}`;
      params.push(category);
    }

    if (tag) {
      paramCount++;
      query += ` AND EXISTS (
        SELECT 1 FROM sop_page_tags pt2 
        JOIN sop_tags t2 ON pt2.tag_id = t2.id 
        WHERE pt2.page_id = p.id AND t2.slug = $${paramCount}
      )`;
      params.push(tag);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        to_tsvector('english', p.title || ' ' || coalesce(p.excerpt, '') || ' ' || p.content) @@ plainto_tsquery('english', $${paramCount})
        OR p.title ILIKE $${paramCount + 1}
      )`;
      params.push(search, `%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY p.id, c.name, c.slug, c.color, u.full_name
               ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ pages: result.rows });
  } catch (error) {
    console.error('List public SOP pages error:', error);
    res.status(500).json({ error: 'Failed to fetch public pages' });
  }
});

// Get single public page
router.get('/public/:slug', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { password } = req.body;

    const result = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             u.full_name as author_name, u.avatar_url as author_avatar,
             ARRAY_AGG(DISTINCT jsonb_build_object('name', t.name, 'slug', t.slug, 'color', t.color)) 
             FILTER (WHERE t.name IS NOT NULL) as tags
      FROM sop_pages p
      LEFT JOIN sop_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN sop_page_tags pt ON p.id = pt.page_id
      LEFT JOIN sop_tags t ON pt.tag_id = t.id
      WHERE p.organization_id = $1 AND p.slug = $2 AND p.visibility = 'public' AND p.status = 'published'
      GROUP BY p.id, c.name, c.slug, c.color, u.full_name, u.avatar_url
    `, [orgId, req.params.slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = result.rows[0];

    // Check password if protected
    if (page.password_protected) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', password_protected: true });
      }
      const isValid = await bcrypt.compare(password, page.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password', password_protected: true });
      }
    }

    // Remove password hash from response
    delete page.password_hash;

    // Track view
    await db.query(`
      INSERT INTO sop_page_views (page_id, organization_id, ip_address, user_agent, referer)
      VALUES ($1, $2, $3, $4, $5)
    `, [page.id, orgId, req.ip, req.headers['user-agent'], req.headers['referer']]);

    res.json(page);
  } catch (error) {
    console.error('Get public SOP page error:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Protected routes (auth required)
router.use(authenticate);

// List all pages (private + public)
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { category, tag, search, status, visibility, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
             u.full_name as author_name,
             ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM sop_pages p
      LEFT JOIN sop_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN sop_page_tags pt ON p.id = pt.page_id
      LEFT JOIN sop_tags t ON pt.tag_id = t.id
      WHERE p.organization_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND c.slug = $${paramCount}`;
      params.push(category);
    }

    if (tag) {
      paramCount++;
      query += ` AND EXISTS (
        SELECT 1 FROM sop_page_tags pt2 
        JOIN sop_tags t2 ON pt2.tag_id = t2.id 
        WHERE pt2.page_id = p.id AND t2.slug = $${paramCount}
      )`;
      params.push(tag);
    }

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (visibility) {
      paramCount++;
      query += ` AND p.visibility = $${paramCount}`;
      params.push(visibility);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        to_tsvector('english', p.title || ' ' || coalesce(p.excerpt, '') || ' ' || p.content) @@ plainto_tsquery('english', $${paramCount})
        OR p.title ILIKE $${paramCount + 1}
      )`;
      params.push(search, `%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY p.id, c.name, c.slug, c.color, u.full_name
               ORDER BY p.updated_at DESC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ pages: result.rows });
  } catch (error) {
    console.error('List SOP pages error:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get single page (private or public)
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);

    const result = await db.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             u.full_name as author_name, u.avatar_url as author_avatar,
             e.full_name as editor_name,
             ARRAY_AGG(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'color', t.color)) 
             FILTER (WHERE t.name IS NOT NULL) as tags
      FROM sop_pages p
      LEFT JOIN sop_categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN users e ON p.last_edited_by = e.id
      LEFT JOIN sop_page_tags pt ON p.id = pt.page_id
      LEFT JOIN sop_tags t ON pt.tag_id = t.id
      WHERE p.organization_id = $1 AND p.id = $2
      GROUP BY p.id, c.name, c.slug, u.full_name, u.avatar_url, e.full_name
    `, [orgId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = result.rows[0];
    delete page.password_hash;

    res.json(page);
  } catch (error) {
    console.error('Get SOP page error:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Create page
router.post('/', authorize('admin', 'manager', 'member'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const {
      title, slug, excerpt, content, content_type, category_id,
      meta_title, meta_description, meta_keywords,
      visibility, password, status, tags,
      featured_image_url
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      const slugResult = await db.query('SELECT generate_sop_slug($1, $2) as slug', [title, orgId]);
      finalSlug = slugResult.rows[0].slug;
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const published_at = status === 'published' ? new Date() : null;

    const result = await db.query(`
      INSERT INTO sop_pages (
        organization_id, category_id, title, slug, excerpt, content, content_type,
        meta_title, meta_description, meta_keywords,
        visibility, password_protected, password_hash, status, published_at,
        featured_image_url, author_id, last_edited_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      orgId, category_id, title, finalSlug, excerpt, content, content_type || 'markdown',
      meta_title, meta_description, meta_keywords,
      visibility || 'private', !!password, passwordHash, status || 'draft', published_at,
      featured_image_url, req.user.id, req.user.id
    ]);

    const page = result.rows[0];

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Get or create tag
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const tagResult = await db.query(`
          INSERT INTO sop_tags (organization_id, name, slug)
          VALUES ($1, $2, $3)
          ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [orgId, tagName, tagSlug]);

        // Link tag to page
        await db.query(`
          INSERT INTO sop_page_tags (page_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [page.id, tagResult.rows[0].id]);
      }
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'sop_page', page.id, req.ip, req.headers['user-agent']]
    );

    res.status(201).json(page);
  } catch (error) {
    console.error('Create SOP page error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A page with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page
router.patch('/:id', authorize('admin', 'manager', 'member'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'title', 'slug', 'excerpt', 'content', 'content_type', 'category_id',
      'meta_title', 'meta_description', 'meta_keywords',
      'visibility', 'status', 'featured_image_url'
    ];

    allowedFields.forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    // Handle password update
    if (updates.password) {
      const passwordHash = await bcrypt.hash(updates.password, 10);
      fields.push(`password_protected = TRUE`);
      fields.push(`password_hash = $${paramCount}`);
      values.push(passwordHash);
      paramCount++;
    } else if (updates.password === null) {
      fields.push(`password_protected = FALSE`);
      fields.push(`password_hash = NULL`);
    }

    // Set published_at if status changes to published
    if (updates.status === 'published') {
      fields.push(`published_at = COALESCE(published_at, NOW())`);
    }

    if (fields.length === 0 && !updates.tags) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    fields.push(`last_edited_by = $${paramCount}`);
    values.push(req.user.id);
    paramCount++;

    values.push(req.params.id, orgId);

    if (fields.length > 0) {
      const result = await db.query(
        `UPDATE sop_pages SET ${fields.join(', ')}, updated_at = NOW() 
         WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }
    }

    // Update tags if provided
    if (updates.tags) {
      // Remove existing tags
      await db.query('DELETE FROM sop_page_tags WHERE page_id = $1', [req.params.id]);

      // Add new tags
      for (const tagName of updates.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const tagResult = await db.query(`
          INSERT INTO sop_tags (organization_id, name, slug)
          VALUES ($1, $2, $3)
          ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [orgId, tagName, tagSlug]);

        await db.query(`
          INSERT INTO sop_page_tags (page_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [req.params.id, tagResult.rows[0].id]);
      }
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'sop_page', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]
    );

    // Fetch updated page
    const result = await db.query('SELECT * FROM sop_pages WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update SOP page error:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete page
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(
      'DELETE FROM sop_pages WHERE id = $1 AND organization_id = $2 RETURNING id',
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    await db.query(
      'INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'sop_page', req.params.id, req.ip, req.headers['user-agent']]
    );

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete SOP page error:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

module.exports = router;

