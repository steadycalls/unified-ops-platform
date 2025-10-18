const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { validateOrganization, rateLimit } = require('../middleware/enhanced');
const os = require('os');

// System health endpoint (with minimal info for security)
router.get('/health', rateLimit({ max: 100, windowMs: 60000 }), async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Basic health info only (don't expose system details)
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency: dbLatency
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service temporarily unavailable'
    });
  }
});

// Detailed system health (authenticated, for admins only)
router.get('/health/detailed', authenticate, authorize('admin'), async (req, res) => {
  try {
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      database: {
        connected: true,
        latency: dbLatency
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      },
      process: {
        pid: process.pid,
        uptime: uptime,
        memory: memoryUsage,
        cpu: cpuUsage
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service temporarily unavailable'
    });
  }
});

// Helper function to validate and get interval days
const getIntervalDays = (timeRange) => {
  const intervals = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  };
  return intervals[timeRange] || 7;
};

// Organization dashboard metrics
router.get('/:org/dashboard', 
  rateLimit({ max: 60, windowMs: 60000 }), // 60 requests per minute
  authenticate, 
  validateOrganization, 
  authorize('viewer'), 
  async (req, res) => {
    try {
      const { organizationId } = req;
      const timeRange = req.query.range || '7d';
      const intervalDays = getIntervalDays(timeRange);

      // Get counts with null safety
      const countsResult = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM clients WHERE organization_id = $1) as clients,
          (SELECT COUNT(*) FROM projects WHERE organization_id = $1) as projects,
          (SELECT COUNT(*) FROM projects WHERE organization_id = $1 AND status = 'active') as active_projects,
          (SELECT COUNT(*) FROM opportunities WHERE organization_id = $1) as opportunities,
          (SELECT COUNT(*) FROM opportunities WHERE organization_id = $1 AND stage NOT IN ('won', 'lost')) as open_opportunities,
          (SELECT COUNT(*) FROM notes WHERE organization_id = $1) as notes,
          (SELECT COALESCE(SUM(value), 0) FROM opportunities WHERE organization_id = $1 AND stage NOT IN ('won', 'lost')) as pipeline_value
      `, [organizationId]);

      const counts = countsResult.rows[0] || {};

      // Get recent activity (parameterized)
      const activityResult = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM activity_logs
        WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [organizationId, intervalDays]);

      // Get top users by activity (parameterized)
      const topUsersResult = await db.query(`
        SELECT 
          u.full_name,
          u.email,
          COUNT(al.id) as activity_count
        FROM users u
        JOIN activity_logs al ON u.id = al.user_id
        WHERE al.organization_id = $1 AND al.created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY u.id, u.full_name, u.email
        ORDER BY activity_count DESC
        LIMIT 10
      `, [organizationId, intervalDays]);

      // Get project status breakdown
      const projectStatusResult = await db.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM projects
        WHERE organization_id = $1
        GROUP BY status
      `, [organizationId]);

      // Get opportunity stage breakdown
      const opportunityStageResult = await db.query(`
        SELECT 
          stage,
          COUNT(*) as count,
          COALESCE(SUM(value), 0) as total_value
        FROM opportunities
        WHERE organization_id = $1
        GROUP BY stage
      `, [organizationId]);

      res.json({
        success: true,
        data: {
          overview: {
            totalClients: parseInt(counts.clients || 0),
            totalProjects: parseInt(counts.projects || 0),
            activeProjects: parseInt(counts.active_projects || 0),
            totalOpportunities: parseInt(counts.opportunities || 0),
            openOpportunities: parseInt(counts.open_opportunities || 0),
            totalNotes: parseInt(counts.notes || 0),
            pipelineValue: parseFloat(counts.pipeline_value || 0)
          },
          activity: {
            daily: activityResult.rows || [],
            topUsers: topUsersResult.rows || []
          },
          projects: {
            byStatus: projectStatusResult.rows || []
          },
          opportunities: {
            byStage: opportunityStageResult.rows || []
          },
          timeRange: timeRange
        }
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to fetch dashboard metrics' }
      });
    }
  }
);

// Performance metrics
router.get('/:org/performance', 
  rateLimit({ max: 30, windowMs: 60000 }), // 30 requests per minute
  authenticate, 
  validateOrganization, 
  authorize('admin'), 
  async (req, res) => {
    try {
      const { organizationId } = req;

      // Database statistics
      const dbStatsResult = await db.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `);

      // Slow queries (from pg_stat_statements if available)
      let slowQueries = [];
      try {
        const slowQueriesResult = await db.query(`
          SELECT 
            LEFT(query, 100) as query,
            calls,
            ROUND(total_exec_time::numeric, 2) as total_exec_time,
            ROUND(mean_exec_time::numeric, 2) as mean_exec_time,
            ROUND(max_exec_time::numeric, 2) as max_exec_time
          FROM pg_stat_statements
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `);
        slowQueries = slowQueriesResult.rows || [];
      } catch (e) {
        // pg_stat_statements not enabled - that's okay
        slowQueries = [];
      }

      // Connection pool stats (with null safety)
      const poolStats = {
        total: db.pool?.totalCount || 0,
        idle: db.pool?.idleCount || 0,
        waiting: db.pool?.waitingCount || 0
      };

      // Error rate (parameterized)
      const errorRateResult = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM error_logs
        WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [organizationId]);

      // Webhook delivery stats (parameterized)
      const webhookStatsResult = await db.query(`
        SELECT 
          status,
          COUNT(*) as count,
          ROUND(AVG(duration_ms)::numeric, 2) as avg_duration,
          MAX(duration_ms) as max_duration
        FROM outgoing_webhook_deliveries owd
        JOIN outgoing_webhooks ow ON owd.webhook_id = ow.id
        WHERE ow.organization_id = $1 AND owd.triggered_at > NOW() - INTERVAL '7 days'
        GROUP BY status
      `, [organizationId]);

      res.json({
        success: true,
        data: {
          database: {
            tables: dbStatsResult.rows || [],
            slowQueries: slowQueries,
            connectionPool: poolStats
          },
          errors: {
            daily: errorRateResult.rows || []
          },
          webhooks: {
            byStatus: webhookStatsResult.rows || []
          }
        }
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to fetch performance metrics' }
      });
    }
  }
);

// User activity metrics
router.get('/:org/users', 
  rateLimit({ max: 60, windowMs: 60000 }),
  authenticate, 
  validateOrganization, 
  authorize('admin'), 
  async (req, res) => {
    try {
      const { organizationId } = req;
      const timeRange = req.query.range || '7d';
      const intervalDays = getIntervalDays(timeRange);

      // Active users (parameterized)
      const activeUsersResult = await db.query(`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.last_login_at,
          COUNT(DISTINCT DATE(al.created_at)) as active_days,
          COUNT(al.id) as total_actions
        FROM users u
        JOIN user_organization_roles uor ON u.id = uor.user_id
        LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at > NOW() - INTERVAL '1 day' * $2
        WHERE uor.organization_id = $1
        GROUP BY u.id, u.full_name, u.email, u.last_login_at
        ORDER BY total_actions DESC
      `, [organizationId, intervalDays]);

      // User activity by day (parameterized)
      const activityByDayResult = await db.query(`
        SELECT 
          DATE(al.created_at) as date,
          COUNT(DISTINCT al.user_id) as unique_users,
          COUNT(al.id) as total_actions
        FROM activity_logs al
        WHERE al.organization_id = $1 AND al.created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY DATE(al.created_at)
        ORDER BY date DESC
      `, [organizationId, intervalDays]);

      // Most common actions (parameterized)
      const commonActionsResult = await db.query(`
        SELECT 
          action,
          entity_type,
          COUNT(*) as count
        FROM activity_logs
        WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
        GROUP BY action, entity_type
        ORDER BY count DESC
        LIMIT 20
      `, [organizationId, intervalDays]);

      res.json({
        success: true,
        data: {
          users: activeUsersResult.rows || [],
          activityByDay: activityByDayResult.rows || [],
          commonActions: commonActionsResult.rows || [],
          timeRange: timeRange
        }
      });
    } catch (error) {
      console.error('User metrics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to fetch user metrics' }
      });
    }
  }
);

// Integration health
router.get('/:org/integrations', 
  rateLimit({ max: 60, windowMs: 60000 }),
  authenticate, 
  validateOrganization, 
  authorize('admin'), 
  async (req, res) => {
    try {
      const { organizationId } = req;

      // Integration status
      const integrationsResult = await db.query(`
        SELECT 
          i.id,
          i.integration_type,
          i.name,
          i.is_active,
          i.last_sync_at,
          i.last_sync_status,
          COUNT(il.id) as log_count,
          SUM(CASE WHEN il.status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN il.status = 'error' THEN 1 ELSE 0 END) as error_count
        FROM integrations i
        LEFT JOIN integration_logs il ON i.id = il.integration_id AND il.created_at > NOW() - INTERVAL '7 days'
        WHERE i.organization_id = $1
        GROUP BY i.id, i.integration_type, i.name, i.is_active, i.last_sync_at, i.last_sync_status
      `, [organizationId]);

      // Webhook health
      const webhooksResult = await db.query(`
        SELECT 
          ow.id,
          ow.name,
          ow.url,
          ow.is_active,
          COUNT(owd.id) as delivery_count,
          SUM(CASE WHEN owd.status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
          SUM(CASE WHEN owd.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          ROUND(AVG(owd.duration_ms)::numeric, 2) as avg_duration
        FROM outgoing_webhooks ow
        LEFT JOIN outgoing_webhook_deliveries owd ON ow.id = owd.webhook_id AND owd.triggered_at > NOW() - INTERVAL '7 days'
        WHERE ow.organization_id = $1
        GROUP BY ow.id, ow.name, ow.url, ow.is_active
      `, [organizationId]);

      // Recent errors
      const recentErrorsResult = await db.query(`
        SELECT 
          il.id,
          i.name as integration_name,
          il.action,
          il.status,
          il.error_message,
          il.created_at
        FROM integration_logs il
        JOIN integrations i ON il.integration_id = i.id
        WHERE i.organization_id = $1 AND il.status = 'error'
        ORDER BY il.created_at DESC
        LIMIT 20
      `, [organizationId]);

      res.json({
        success: true,
        data: {
          integrations: integrationsResult.rows || [],
          webhooks: webhooksResult.rows || [],
          recentErrors: recentErrorsResult.rows || []
        }
      });
    } catch (error) {
      console.error('Integration metrics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to fetch integration metrics' }
      });
    }
  }
);

// SOP analytics
router.get('/:org/sop-analytics', 
  rateLimit({ max: 60, windowMs: 60000 }),
  authenticate, 
  validateOrganization, 
  authorize('viewer'), 
  async (req, res) => {
    try {
      const { organizationId } = req;

      // Most viewed pages
      const mostViewedResult = await db.query(`
        SELECT 
          sp.id,
          sp.title,
          sp.slug,
          sp.visibility,
          sp.view_count,
          COUNT(DISTINCT spv.user_id) as unique_viewers,
          COUNT(spv.id) as total_views
        FROM sop_pages sp
        LEFT JOIN sop_page_views spv ON sp.id = spv.page_id AND spv.viewed_at > NOW() - INTERVAL '30 days'
        WHERE sp.organization_id = $1
        GROUP BY sp.id, sp.title, sp.slug, sp.visibility, sp.view_count
        ORDER BY sp.view_count DESC
        LIMIT 20
      `, [organizationId]);

      // Views by category
      const viewsByCategoryResult = await db.query(`
        SELECT 
          sc.name as category_name,
          COUNT(DISTINCT sp.id) as page_count,
          COALESCE(SUM(sp.view_count), 0) as total_views
        FROM sop_categories sc
        LEFT JOIN sop_pages sp ON sc.id = sp.category_id
        WHERE sc.organization_id = $1
        GROUP BY sc.id, sc.name
        ORDER BY total_views DESC
      `, [organizationId]);

      // Recent views
      const recentViewsResult = await db.query(`
        SELECT 
          sp.title,
          sp.slug,
          u.full_name as viewer_name,
          spv.viewed_at
        FROM sop_page_views spv
        JOIN sop_pages sp ON spv.page_id = sp.id
        LEFT JOIN users u ON spv.user_id = u.id
        WHERE sp.organization_id = $1
        ORDER BY spv.viewed_at DESC
        LIMIT 50
      `, [organizationId]);

      // Popular tags
      const popularTagsResult = await db.query(`
        SELECT 
          st.name,
          st.slug,
          st.usage_count
        FROM sop_tags st
        WHERE st.organization_id = $1
        ORDER BY st.usage_count DESC
        LIMIT 20
      `, [organizationId]);

      res.json({
        success: true,
        data: {
          mostViewed: mostViewedResult.rows || [],
          viewsByCategory: viewsByCategoryResult.rows || [],
          recentViews: recentViewsResult.rows || [],
          popularTags: popularTagsResult.rows || []
        }
      });
    } catch (error) {
      console.error('SOP analytics error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to fetch SOP analytics' }
      });
    }
  }
);

module.exports = router;

