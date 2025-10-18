const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../config/database');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('member'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.docx', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only TXT, PDF, DOCX, and MD files are allowed.'));
    }
  }
});

async function getOrgId(orgSlug) {
  const result = await db.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
  return result.rows[0]?.id;
}

// Extract text from uploaded file
async function extractTextFromFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.txt' || ext === '.md') {
      return await fs.readFile(filePath, 'utf8');
    } else if (ext === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    return '';
  } catch (error) {
    console.error('Text extraction error:', error);
    return '';
  }
}

// List notes
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { entity_type, entity_id, tags, search, is_pinned, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT n.*, u.full_name as created_by_name, f.file_name, f.storage_url
      FROM notes n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN files f ON n.attachment_file_id = f.id
      WHERE n.organization_id = $1 AND n.is_archived = FALSE
    `;
    const params = [orgId];
    let paramCount = 1;

    if (entity_type && entity_id) {
      paramCount++;
      query += ` AND n.entity_type = $${paramCount}`;
      params.push(entity_type);
      paramCount++;
      query += ` AND n.entity_id = $${paramCount}`;
      params.push(entity_id);
    }

    if (tags) {
      paramCount++;
      query += ` AND n.tags && $${paramCount}`;
      params.push(tags.split(','));
    }

    if (search) {
      paramCount++;
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (is_pinned === 'true') {
      query += ` AND n.is_pinned = TRUE`;
    }

    query += ` ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM notes WHERE organization_id = $1 AND is_archived = FALSE', [orgId]);

    res.json({
      notes: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('List notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const result = await db.query(`
      SELECT n.*, u.full_name as created_by_name, f.file_name, f.storage_url
      FROM notes n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN files f ON n.attachment_file_id = f.id
      WHERE n.id = $1 AND n.organization_id = $2
    `, [req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Create note (manual text entry)
router.post('/', checkPermission('notes', 'create'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { title, content, content_type, entity_type, entity_id, tags } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await db.query(`
      INSERT INTO notes (organization_id, created_by, title, content, content_type, source, entity_type, entity_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [orgId, req.user.id, title, content, content_type || 'text', 'manual', entity_type, entity_id, tags]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'created', 'note', result.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Upload file as note
router.post('/upload', checkPermission('notes', 'create'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const orgId = await getOrgId(req.params.org);
    const { title, entity_type, entity_id, tags } = req.body;

    // Extract text from file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

    // Save file record
    const fileResult = await db.query(`
      INSERT INTO files (organization_id, uploaded_by, file_name, file_type, file_size, storage_path, entity_type, entity_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [orgId, req.user.id, req.file.originalname, req.file.mimetype, req.file.size, req.file.path, entity_type, entity_id]);

    // Create note with extracted text
    const noteResult = await db.query(`
      INSERT INTO notes (organization_id, created_by, title, content, content_type, source, entity_type, entity_id, tags, has_attachment, attachment_file_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [orgId, req.user.id, title || req.file.originalname, extractedText, 'text', 'file_upload', entity_type, entity_id, tags ? tags.split(',') : null, true, fileResult.rows[0].id]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'uploaded', 'note', noteResult.rows[0].id, req.ip, req.headers['user-agent']]);

    res.status(201).json({
      note: noteResult.rows[0],
      file: fileResult.rows[0]
    });
  } catch (error) {
    console.error('Upload note error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update note
router.patch('/:id', checkPermission('notes', 'update'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const updates = req.body;
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'organization_id' && key !== 'created_at' && key !== 'created_by') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, orgId);
    const result = await db.query(`UPDATE notes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} AND organization_id = $${paramCount + 1} RETURNING *`, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, changes, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, orgId, 'updated', 'note', req.params.id, JSON.stringify(updates), req.ip, req.headers['user-agent']]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Attach note to entity
router.post('/:id/attach', checkPermission('notes', 'update'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    const { entity_type, entity_id } = req.body;

    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    const result = await db.query(`UPDATE notes SET entity_type = $1, entity_id = $2, updated_at = NOW() WHERE id = $3 AND organization_id = $4 RETURNING *`,
      [entity_type, entity_id, req.params.id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Attach note error:', error);
    res.status(500).json({ error: 'Failed to attach note' });
  }
});

// Delete note
router.delete('/:id', checkPermission('notes', 'delete'), async (req, res) => {
  try {
    const orgId = await getOrgId(req.params.org);
    
    // Get note with file info
    const noteResult = await db.query('SELECT * FROM notes WHERE id = $1 AND organization_id = $2', [req.params.id, orgId]);
    
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Delete associated file if exists
    if (note.attachment_file_id) {
      const fileResult = await db.query('SELECT storage_path FROM files WHERE id = $1', [note.attachment_file_id]);
      if (fileResult.rows.length > 0) {
        await fs.unlink(fileResult.rows[0].storage_path).catch(console.error);
        await db.query('DELETE FROM files WHERE id = $1', [note.attachment_file_id]);
      }
    }

    // Delete note
    await db.query('DELETE FROM notes WHERE id = $1', [req.params.id]);

    await db.query('INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, orgId, 'deleted', 'note', req.params.id, req.ip, req.headers['user-agent']]);

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;

