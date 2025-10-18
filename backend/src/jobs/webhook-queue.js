const db = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Webhook queue processor
 * Handles asynchronous webhook delivery with retry logic
 */

// Queue for pending webhooks
const webhookQueue = [];
let isProcessing = false;

// Add webhook to queue
const queueWebhook = async (webhookId, eventType, data) => {
  try {
    await db.query(`
      INSERT INTO outgoing_webhook_deliveries (webhook_id, event_type, payload, status, triggered_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING id
    `, [webhookId, eventType, JSON.stringify(data)]);
    
    console.log(`[Webhook Queue] Queued webhook ${webhookId} for event ${eventType}`);
    
    // Start processing if not already running
    if (!isProcessing) {
      processQueue();
    }
  } catch (error) {
    console.error('[Webhook Queue] Failed to queue webhook:', error);
  }
};

// Generate HMAC signature
const generateSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

// Send webhook with retry logic
const sendWebhook = async (delivery) => {
  const maxRetries = 3;
  const retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get webhook details
      const webhookResult = await db.query(
        'SELECT * FROM outgoing_webhooks WHERE id = $1',
        [delivery.webhook_id]
      );
      
      if (webhookResult.rows.length === 0) {
        console.error(`[Webhook Queue] Webhook ${delivery.webhook_id} not found`);
        return { success: false, error: 'Webhook not found' };
      }
      
      const webhook = webhookResult.rows[0];
      
      // Prepare request
      const payload = JSON.parse(delivery.payload);
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Unified-Ops-Platform/1.0',
        'X-Webhook-Event': delivery.event_type,
        'X-Webhook-Delivery-Id': delivery.id,
        'X-Webhook-Signature': generateSignature(payload, webhook.secret)
      };
      
      // Add authentication if configured
      if (webhook.auth_type === 'bearer' && webhook.auth_value) {
        headers['Authorization'] = `Bearer ${webhook.auth_value}`;
      } else if (webhook.auth_type === 'basic' && webhook.auth_value) {
        headers['Authorization'] = `Basic ${webhook.auth_value}`;
      } else if (webhook.auth_type === 'api_key' && webhook.auth_value) {
        headers['X-API-Key'] = webhook.auth_value;
      }
      
      // Send request
      const startTime = Date.now();
      const response = await axios({
        method: webhook.http_method.toLowerCase(),
        url: webhook.url,
        headers,
        data: payload,
        timeout: webhook.timeout_seconds * 1000,
        validateStatus: () => true // Don't throw on any status
      });
      
      const duration = Date.now() - startTime;
      
      // Check if successful
      const isSuccess = response.status >= 200 && response.status < 300;
      
      // Update delivery record
      await db.query(`
        UPDATE outgoing_webhook_deliveries
        SET 
          status = $1,
          response_status_code = $2,
          response_body = $3,
          delivered_at = NOW(),
          attempts = $4,
          duration_ms = $5
        WHERE id = $6
      `, [
        isSuccess ? 'delivered' : 'failed',
        response.status,
        JSON.stringify(response.data).substring(0, 10000), // Limit size
        attempt + 1,
        duration,
        delivery.id
      ]);
      
      if (isSuccess) {
        console.log(`[Webhook Queue] Successfully delivered webhook ${delivery.id} (attempt ${attempt + 1})`);
        return { success: true, status: response.status };
      }
      
      // If not last attempt, wait before retry
      if (attempt < maxRetries) {
        console.log(`[Webhook Queue] Webhook ${delivery.id} failed (status ${response.status}), retrying in ${retryDelays[attempt]}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      } else {
        console.error(`[Webhook Queue] Webhook ${delivery.id} failed after ${maxRetries + 1} attempts`);
        return { success: false, error: 'Max retries exceeded', status: response.status };
      }
      
    } catch (error) {
      console.error(`[Webhook Queue] Error sending webhook ${delivery.id} (attempt ${attempt + 1}):`, error.message);
      
      // Update delivery record with error
      await db.query(`
        UPDATE outgoing_webhook_deliveries
        SET 
          status = 'failed',
          response_body = $1,
          attempts = $2
        WHERE id = $3
      `, [
        JSON.stringify({ error: error.message }),
        attempt + 1,
        delivery.id
      ]);
      
      // If not last attempt, wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
};

// Process webhook queue
const processQueue = async () => {
  if (isProcessing) return;
  
  isProcessing = true;
  
  try {
    while (true) {
      // Get pending deliveries
      const result = await db.query(`
        SELECT * FROM outgoing_webhook_deliveries
        WHERE status = 'pending'
        ORDER BY triggered_at ASC
        LIMIT 10
      `);
      
      if (result.rows.length === 0) {
        break; // No more pending deliveries
      }
      
      // Process deliveries in parallel (up to 10 at a time)
      await Promise.all(
        result.rows.map(delivery => sendWebhook(delivery))
      );
    }
  } catch (error) {
    console.error('[Webhook Queue] Error processing queue:', error);
  } finally {
    isProcessing = false;
  }
};

// Trigger webhooks for an event
const triggerWebhooks = async (organizationId, eventType, data) => {
  try {
    // Get active webhooks for this event
    const result = await db.query(`
      SELECT id FROM outgoing_webhooks
      WHERE organization_id = $1
        AND is_active = TRUE
        AND $2 = ANY(event_types)
    `, [organizationId, eventType]);
    
    // Queue all webhooks
    for (const webhook of result.rows) {
      await queueWebhook(webhook.id, eventType, data);
    }
    
    console.log(`[Webhook Queue] Triggered ${result.rows.length} webhooks for event ${eventType}`);
  } catch (error) {
    console.error('[Webhook Queue] Failed to trigger webhooks:', error);
  }
};

// Retry failed webhooks
const retryFailedWebhooks = async () => {
  try {
    console.log('[Webhook Queue] Retrying failed webhooks...');
    
    // Get failed deliveries from last 24 hours
    const result = await db.query(`
      SELECT * FROM outgoing_webhook_deliveries
      WHERE status = 'failed'
        AND triggered_at > NOW() - INTERVAL '24 hours'
        AND attempts < 3
      ORDER BY triggered_at ASC
      LIMIT 100
    `);
    
    if (result.rows.length === 0) {
      console.log('[Webhook Queue] No failed webhooks to retry');
      return;
    }
    
    // Reset to pending
    await db.query(`
      UPDATE outgoing_webhook_deliveries
      SET status = 'pending'
      WHERE id = ANY($1)
    `, [result.rows.map(r => r.id)]);
    
    console.log(`[Webhook Queue] Queued ${result.rows.length} failed webhooks for retry`);
    
    // Start processing
    processQueue();
  } catch (error) {
    console.error('[Webhook Queue] Failed to retry webhooks:', error);
  }
};

// Schedule periodic retry of failed webhooks
const scheduleRetries = () => {
  // Retry every hour
  setInterval(retryFailedWebhooks, 60 * 60 * 1000);
  console.log('[Webhook Queue] Scheduled retry of failed webhooks every hour');
};

// Get queue statistics
const getQueueStats = async () => {
  try {
    const result = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration
      FROM outgoing_webhook_deliveries
      WHERE triggered_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);
    
    return result.rows;
  } catch (error) {
    console.error('[Webhook Queue] Failed to get queue stats:', error);
    return [];
  }
};

module.exports = {
  queueWebhook,
  sendWebhook,
  processQueue,
  triggerWebhooks,
  retryFailedWebhooks,
  scheduleRetries,
  getQueueStats
};

// Start retry scheduler if not in test mode
if (process.env.NODE_ENV !== 'test') {
  scheduleRetries();
}

