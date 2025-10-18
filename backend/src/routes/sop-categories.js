const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id, custom_domain FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0];
}

// Public: Get categories
router.get('/public', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const result = await db.query(`
      SELECT c.*, COUNT(p.id) as page_count
      FROM sop_categories c
      LEFT JOIN sop_pages p ON c.id = p.category_id AND p.visibility = 'public' AND p.status = 'published'
      WHERE c.organization_id = $1 AND c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `, [org.id]);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('List public categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Public: Get tags
router.get('/tags/public', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const result = await db.query(`
      SELECT t.*, COUNT(DISTINCT p.id) as page_count
      FROM sop_tags t
      LEFT JOIN sop_page_tags pt ON t.id = pt.tag_id
      LEFT JOIN sop_pages p ON pt.page_id = p.id AND p.visibility = 'public' AND p.status = 'published'
      WHERE t.organization_id = $1
      GROUP BY t.id
      HAVING COUNT(DISTINCT p.id) > 0
      ORDER BY t.usage_count DESC, t.name
    `, [org.id]);

    res.json({ tags: result.rows });
  } catch (error) {
    console.error('List public tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Public: Sitemap XML
router.get('/sitemap.xml', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const baseUrl = org.custom_domain ? `https://${org.custom_domain}` : `https://app.example.com`;

    const result = await db.query(`
      SELECT slug, updated_at, published_at
      FROM sop_pages
      WHERE organization_id = $1 AND visibility = 'public' AND status = 'published'
      ORDER BY updated_at DESC
    `, [org.id]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/sop</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += '  </url>\n';

    // Add each page
    result.rows.forEach(page => {
      const lastmod = page.updated_at || page.published_at;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/sop/${page.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Generate sitemap error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Public: Sitemap JSON (for UI display)
router.get('/sitemap.json', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const baseUrl = org.custom_domain ? `https://${org.custom_domain}` : `https://app.example.com`;

    const result = await db.query(`
      SELECT p.id, p.title, p.slug, p.excerpt, p.updated_at, p.published_at, p.view_count,
             c.name as category_name, c.slug as category_slug
      FROM sop_pages p
      LEFT JOIN sop_categories c ON p.category_id = c.id
      WHERE p.organization_id = $1 AND p.visibility = 'public' AND p.status = 'published'
      ORDER BY c.sort_order, c.name, p.title
    `, [org.id]);

    const sitemap = {
      base_url: baseUrl,
      total_pages: result.rows.length,
      pages: result.rows.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        url: `${baseUrl}/sop/${page.slug}`,
        excerpt: page.excerpt,
        category: page.category_name,
        category_slug: page.category_slug,
        updated_at: page.updated_at,
        published_at: page.published_at,
        view_count: page.view_count
      }))
    };

    res.json(sitemap);
  } catch (error) {
    console.error('Generate sitemap JSON error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

// Protected routes
router.use(authenticate);

// List categories
router.get('/', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const result = await db.query(`
      SELECT c.*, COUNT(p.id) as page_count
      FROM sop_categories c
      LEFT JOIN sop_pages p ON c.id = p.category_id
      WHERE c.organization_id = $1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `, [org.id]);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const { name, slug, description, icon, color, parent_id, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await db.query(`
      INSERT INTO sop_categories (organization_id, name, slug, description, icon, color, parent_id, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [org.id, name, finalSlug, description, icon, color, parent_id, sort_order || 0, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A category with this slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.patch('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'slug', 'description', 'icon', 'color', 'parent_id', 'sort_order', 'is_active'];

    allowedFields.forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, org.id);
    const result = await db.query(
      `UPDATE sop_categories SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const result = await db.query(
      'DELETE FROM sop_categories WHERE id = $1 AND organization_id = $2 RETURNING id',
      [req.params.id, org.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// List tags
router.get('/tags', async (req, res) => {
  try {
    const org = await getOrgId(req.params.org);
    const result = await db.query(`
      SELECT * FROM sop_tags
      WHERE organization_id = $1
      ORDER BY usage_count DESC, name
    `, [org.id]);

    res.json({ tags: result.rows });
  } catch (error) {
    console.error('List tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

module.exports = router;

