const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');

// Verify webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

// Public webhook receiver endpoint
router.post('/:webhookId', async (req, res) => {
  const startTime = Date.now();
  const webhookId = req.params.webhookId;
  const signature = req.headers['x-webhook-signature'];
  const method = req.method;
  const payload = req.body;

  try {
    // Get webhook configuration
    const webhookResult = await db.query('SELECT * FROM webhooks WHERE id = $1 AND is_active = TRUE', [webhookId]);

    if (webhookResult.rows.length === 0) {
      // Log failed request
      await db.query(`
        INSERT INTO webhook_requests (webhook_id, method, headers, body, status, status_code, ip_address, user_agent, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [webhookId, method, JSON.stringify(req.headers), JSON.stringify(payload), 'failed', 404, req.ip, req.headers['user-agent'], 'Webhook not found or inactive']);

      return res.status(404).json({ error: 'Webhook not found or inactive' });
    }

    const webhook = webhookResult.rows[0];

    // Check if method is allowed
    if (!webhook.allowed_methods.includes(method)) {
      await db.query(`
        INSERT INTO webhook_requests (webhook_id, method, headers, body, status, status_code, ip_address, user_agent, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [webhookId, method, JSON.stringify(req.headers), JSON.stringify(payload), 'failed', 405, req.ip, req.headers['user-agent'], 'Method not allowed']);

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify signature if provided
    if (signature) {
      const isValid = verifySignature(payload, signature, webhook.webhook_secret);
      if (!isValid) {
        await db.query(`
          INSERT INTO webhook_requests (webhook_id, method, headers, body, status, status_code, ip_address, user_agent, error_message)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [webhookId, method, JSON.stringify(req.headers), JSON.stringify(payload), 'failed', 401, req.ip, req.headers['user-agent'], 'Invalid signature']);

        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Process webhook based on type
    let processedData = payload;
    let createdEntityId = null;

    if (webhook.auto_process) {
      try {
        if (webhook.webhook_type === 'notes') {
          // Create note from webhook data
          const noteResult = await db.query(`
            INSERT INTO notes (organization_id, title, content, content_type, source, entity_type, entity_id, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            webhook.organization_id,
            payload.title || 'Webhook Note',
            payload.content || JSON.stringify(payload),
            'text',
            'webhook',
            payload.entity_type,
            payload.entity_id,
            payload.tags
          ]);

          createdEntityId = noteResult.rows[0].id;
        } else if (webhook.webhook_type === 'contacts') {
          // Create or update contact
          const contactResult = await db.query(`
            INSERT INTO clients (organization_id, company_name, first_name, last_name, email, phone, custom_fields)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (organization_id, email) DO UPDATE
            SET company_name = EXCLUDED.company_name, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, phone = EXCLUDED.phone, updated_at = NOW()
            RETURNING id
          `, [
            webhook.organization_id,
            payload.company_name,
            payload.first_name,
            payload.last_name,
            payload.email,
            payload.phone,
            JSON.stringify(payload.custom_fields || {})
          ]);

          createdEntityId = contactResult.rows[0].id;
        }
      } catch (processError) {
        console.error('Webhook processing error:', processError);
        // Log failed processing but still record the request
      }
    }

    // Log successful request
    const processingTime = Date.now() - startTime;
    await db.query(`
      INSERT INTO webhook_requests (webhook_id, method, headers, body, status, status_code, processed_data, created_entity_id, processing_time_ms, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      webhookId,
      method,
      JSON.stringify(req.headers),
      JSON.stringify(payload),
      'processed',
      200,
      JSON.stringify(processedData),
      createdEntityId,
      processingTime,
      req.ip,
      req.headers['user-agent']
    ]);

    // Update webhook stats
    await db.query(`
      UPDATE webhooks 
      SET last_received_at = NOW(), total_requests = total_requests + 1, successful_requests = successful_requests + 1
      WHERE id = $1
    `, [webhookId]);

    res.json({
      success: true,
      message: 'Webhook received and processed',
      webhook_id: webhookId,
      created_entity_id: createdEntityId,
      processing_time_ms: processingTime
    });

  } catch (error) {
    console.error('Webhook receiver error:', error);

    // Log error
    try {
      await db.query(`
        INSERT INTO webhook_requests (webhook_id, method, headers, body, status, status_code, error_message, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [webhookId, method, JSON.stringify(req.headers), JSON.stringify(payload), 'failed', 500, error.message, req.ip, req.headers['user-agent']]);

      await db.query('UPDATE webhooks SET total_requests = total_requests + 1, failed_requests = failed_requests + 1 WHERE id = $1', [webhookId]);
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = router;

