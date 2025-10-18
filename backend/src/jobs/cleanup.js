const db = require('../config/database');

/**
 * Database cleanup jobs
 * Run these periodically via cron or scheduler
 */

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    console.log('[Cleanup] Starting expired sessions cleanup...');
    
    const result = await db.query(`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW() - INTERVAL '7 days'
      RETURNING id
    `);
    
    console.log(`[Cleanup] Deleted ${result.rowCount} expired sessions`);
    return result.rowCount;
  } catch (error) {
    console.error('[Cleanup] Failed to clean up expired sessions:', error);
    throw error;
  }
};

// Clean up old activity logs
const cleanupOldActivityLogs = async () => {
  try {
    console.log('[Cleanup] Starting old activity logs cleanup...');
    
    const result = await db.query(`
      DELETE FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL '90 days'
      RETURNING id
    `);
    
    console.log(`[Cleanup] Deleted ${result.rowCount} old activity logs`);
    return result.rowCount;
  } catch (error) {
    console.error('[Cleanup] Failed to clean up old activity logs:', error);
    throw error;
  }
};

// Clean up old webhook deliveries
const cleanupOldWebhookDeliveries = async () => {
  try {
    console.log('[Cleanup] Starting old webhook deliveries cleanup...');
    
    const result = await db.query(`
      DELETE FROM outgoing_webhook_deliveries 
      WHERE triggered_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `);
    
    console.log(`[Cleanup] Deleted ${result.rowCount} old webhook deliveries`);
    return result.rowCount;
  } catch (error) {
    console.error('[Cleanup] Failed to clean up old webhook deliveries:', error);
    throw error;
  }
};

// Clean up old page views
const cleanupOldPageViews = async () => {
  try {
    console.log('[Cleanup] Starting old page views cleanup...');
    
    const result = await db.query(`
      DELETE FROM sop_page_views 
      WHERE viewed_at < NOW() - INTERVAL '90 days'
      RETURNING id
    `);
    
    console.log(`[Cleanup] Deleted ${result.rowCount} old page views`);
    return result.rowCount;
  } catch (error) {
    console.error('[Cleanup] Failed to clean up old page views:', error);
    throw error;
  }
};

// Clean up old error logs
const cleanupOldErrorLogs = async () => {
  try {
    console.log('[Cleanup] Starting old error logs cleanup...');
    
    const result = await db.query(`
      DELETE FROM error_logs 
      WHERE created_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `);
    
    console.log(`[Cleanup] Deleted ${result.rowCount} old error logs`);
    return result.rowCount;
  } catch (error) {
    console.error('[Cleanup] Failed to clean up old error logs:', error);
    throw error;
  }
};

// Vacuum and analyze tables for performance
const vacuumDatabase = async () => {
  try {
    console.log('[Cleanup] Starting database vacuum and analyze...');
    
    const tables = [
      'user_sessions',
      'activity_logs',
      'outgoing_webhook_deliveries',
      'sop_page_views',
      'error_logs'
    ];
    
    for (const table of tables) {
      await db.query(`VACUUM ANALYZE ${table}`);
      console.log(`[Cleanup] Vacuumed and analyzed ${table}`);
    }
    
    console.log('[Cleanup] Database vacuum and analyze complete');
  } catch (error) {
    console.error('[Cleanup] Failed to vacuum database:', error);
    throw error;
  }
};

// Run all cleanup jobs
const runAllCleanupJobs = async () => {
  console.log('[Cleanup] Starting all cleanup jobs...');
  
  const results = {
    sessions: 0,
    activityLogs: 0,
    webhookDeliveries: 0,
    pageViews: 0,
    errorLogs: 0
  };
  
  try {
    results.sessions = await cleanupExpiredSessions();
    results.activityLogs = await cleanupOldActivityLogs();
    results.webhookDeliveries = await cleanupOldWebhookDeliveries();
    results.pageViews = await cleanupOldPageViews();
    results.errorLogs = await cleanupOldErrorLogs();
    
    await vacuumDatabase();
    
    console.log('[Cleanup] All cleanup jobs complete:', results);
    return results;
  } catch (error) {
    console.error('[Cleanup] Cleanup jobs failed:', error);
    throw error;
  }
};

// Schedule cleanup jobs
const scheduleCleanupJobs = () => {
  // Run daily at 2 AM
  const runDaily = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(2, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    const timeout = next.getTime() - now.getTime();
    
    setTimeout(async () => {
      await runAllCleanupJobs();
      runDaily(); // Schedule next run
    }, timeout);
  };
  
  runDaily();
  console.log('[Cleanup] Cleanup jobs scheduled for daily 2 AM');
};

// Export for manual execution
module.exports = {
  cleanupExpiredSessions,
  cleanupOldActivityLogs,
  cleanupOldWebhookDeliveries,
  cleanupOldPageViews,
  cleanupOldErrorLogs,
  vacuumDatabase,
  runAllCleanupJobs,
  scheduleCleanupJobs
};

// Run if executed directly
if (require.main === module) {
  runAllCleanupJobs()
    .then(() => {
      console.log('[Cleanup] Manual cleanup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Cleanup] Manual cleanup failed:', error);
      process.exit(1);
    });
}

