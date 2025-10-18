const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { validateOrganization } = require('../middleware/enhanced');
const os = require('os');

// System health endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // System metrics
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
      error: error.message
    });
  }
});

// Organization dashboard metrics
router.get('/:org/dashboard', authenticate, validateOrganization, authorize('viewer'), async (req, res) => {
  try {
    const { organizationId } = req;
    const timeRange = req.query.range || '7d'; // 7d, 30d, 90d
    
    // Calculate date range
    const intervals = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    const interval = intervals[timeRange] || '7 days';

    // Get counts
    const [clients, projects, opportunities, notes] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM clients WHERE organization_id = $1', [organizationId]),
      db.query('SELECT COUNT(*) as count FROM projects WHERE organization_id = $1', [organizationId]),
      db.query('SELECT COUNT(*) as count FROM opportunities WHERE organization_id = $1', [organizationId]),
      db.query('SELECT COUNT(*) as count FROM notes WHERE organization_id = $1', [organizationId])
    ]);

    // Get active counts
    const [activeProjects, openOpportunities] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM projects WHERE organization_id = $1 AND status = $2', [organizationId, 'active']),
      db.query('SELECT COUNT(*) as count FROM opportunities WHERE organization_id = $1 AND stage NOT IN ($2, $3)', [organizationId, 'won', 'lost'])
    ]);

    // Get revenue pipeline
    const pipelineResult = await db.query(
      'SELECT COALESCE(SUM(value), 0) as total FROM opportunities WHERE organization_id = $1 AND stage NOT IN ($2, $3)',
      [organizationId, 'won', 'lost']
    );

    // Get recent activity
    const activityResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM activity_logs
      WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [organizationId]);

    // Get top users by activity
    const topUsersResult = await db.query(`
      SELECT 
        u.full_name,
        u.email,
        COUNT(al.id) as activity_count
      FROM users u
      JOIN activity_logs al ON u.id = al.user_id
      WHERE al.organization_id = $1 AND al.created_at > NOW() - INTERVAL '${interval}'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY activity_count DESC
      LIMIT 10
    `, [organizationId]);

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
          totalClients: parseInt(clients.rows[0].count),
          totalProjects: parseInt(projects.rows[0].count),
          activeProjects: parseInt(activeProjects.rows[0].count),
          totalOpportunities: parseInt(opportunities.rows[0].count),
          openOpportunities: parseInt(openOpportunities.rows[0].count),
          totalNotes: parseInt(notes.rows[0].count),
          pipelineValue: parseFloat(pipelineResult.rows[0].total)
        },
        activity: {
          daily: activityResult.rows,
          topUsers: topUsersResult.rows
        },
        projects: {
          byStatus: projectStatusResult.rows
        },
        opportunities: {
          byStage: opportunityStageResult.rows
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
});

// Performance metrics
router.get('/:org/performance', authenticate, validateOrganization, authorize('admin'), async (req, res) => {
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
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);
      slowQueries = slowQueriesResult.rows;
    } catch (e) {
      // pg_stat_statements not enabled
    }

    // Connection pool stats
    const poolStats = {
      total: db.pool.totalCount,
      idle: db.pool.idleCount,
      waiting: db.pool.waitingCount
    };

    // Error rate
    const errorRateResult = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM error_logs
      WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [organizationId]);

    // Webhook delivery stats
    const webhookStatsResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        MAX(duration_ms) as max_duration
      FROM outgoing_webhook_deliveries owd
      JOIN outgoing_webhooks ow ON owd.webhook_id = ow.id
      WHERE ow.organization_id = $1 AND owd.triggered_at > NOW() - INTERVAL '7 days'
      GROUP BY status
    `, [organizationId]);

    // API response times (from activity logs)
    const responseTimesResult = await db.query(`
      SELECT 
        action,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (created_at - created_at))) as avg_time
      FROM activity_logs
      WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, [organizationId]);

    res.json({
      success: true,
      data: {
        database: {
          tables: dbStatsResult.rows,
          slowQueries: slowQueries,
          connectionPool: poolStats
        },
        errors: {
          daily: errorRateResult.rows
        },
        webhooks: {
          byStatus: webhookStatsResult.rows
        },
        api: {
          topEndpoints: responseTimesResult.rows
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
});

// User activity metrics
router.get('/:org/users', authenticate, validateOrganization, authorize('admin'), async (req, res) => {
  try {
    const { organizationId } = req;
    const timeRange = req.query.range || '7d';
    
    const intervals = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    const interval = intervals[timeRange] || '7 days';

    // Active users
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
      LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at > NOW() - INTERVAL '${interval}'
      WHERE uor.organization_id = $1
      GROUP BY u.id, u.full_name, u.email, u.last_login_at
      ORDER BY total_actions DESC
    `, [organizationId]);

    // User activity by day
    const activityByDayResult = await db.query(`
      SELECT 
        DATE(al.created_at) as date,
        COUNT(DISTINCT al.user_id) as unique_users,
        COUNT(al.id) as total_actions
      FROM activity_logs al
      WHERE al.organization_id = $1 AND al.created_at > NOW() - INTERVAL '${interval}'
      GROUP BY DATE(al.created_at)
      ORDER BY date DESC
    `, [organizationId]);

    // Most common actions
    const commonActionsResult = await db.query(`
      SELECT 
        action,
        entity_type,
        COUNT(*) as count
      FROM activity_logs
      WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '${interval}'
      GROUP BY action, entity_type
      ORDER BY count DESC
      LIMIT 20
    `, [organizationId]);

    res.json({
      success: true,
      data: {
        users: activeUsersResult.rows,
        activityByDay: activityByDayResult.rows,
        commonActions: commonActionsResult.rows,
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
});

// Integration health
router.get('/:org/integrations', authenticate, validateOrganization, authorize('admin'), async (req, res) => {
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
        AVG(owd.duration_ms) as avg_duration
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
        integrations: integrationsResult.rows,
        webhooks: webhooksResult.rows,
        recentErrors: recentErrorsResult.rows
      }
    });
  } catch (error) {
    console.error('Integration metrics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'METRICS_ERROR', message: 'Failed to fetch integration metrics' }
    });
  }
});

// SOP analytics
router.get('/:org/sop-analytics', authenticate, validateOrganization, authorize('viewer'), async (req, res) => {
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
        SUM(sp.view_count) as total_views
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
        mostViewed: mostViewedResult.rows,
        viewsByCategory: viewsByCategoryResult.rows,
        recentViews: recentViewsResult.rows,
        popularTags: popularTagsResult.rows
      }
    });
  } catch (error) {
    console.error('SOP analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'METRICS_ERROR', message: 'Failed to fetch SOP analytics' }
    });
  }
});

module.exports = router;

