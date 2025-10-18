const db = require('../config/database');

// Organization cache
const orgCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Validate and cache organization
const validateOrganization = async (req, res, next) => {
  try {
    const orgSlug = req.params.org;
    
    if (!orgSlug) {
      return res.status(400).json({ 
        success: false,
        error: { code: 'MISSING_ORG', message: 'Organization parameter required' }
      });
    }

    // Check cache
    const cached = orgCache.get(orgSlug);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      req.organization = cached.data;
      req.organizationId = cached.data.id;
      req.organizationSlug = orgSlug;
      return next();
    }

    // Query database
    const result = await db.query(
      'SELECT id, name, slug, custom_domain, settings FROM organizations WHERE slug = $1 AND is_active = TRUE',
      [orgSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' }
      });
    }

    const org = result.rows[0];
    
    // Cache it
    orgCache.set(orgSlug, {
      data: org,
      timestamp: Date.now()
    });

    req.organization = org;
    req.organizationId = org.id;
    req.organizationSlug = orgSlug;
    next();
  } catch (error) {
    console.error('Organization validation error:', error);
    res.status(500).json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to validate organization' }
    });
  }
};

// Input validation with Joi-like schema
const validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }
      
      // Skip validation if not required and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push({ field, message: `${field} must be a ${rules.type}` });
      }
      
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }
      
      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
      }
      
      // Email format
      if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ field, message: `${field} must be a valid email` });
      }
      
      // URL format
      if (rules.url && !/^https?:\/\/.+/.test(value)) {
        errors.push({ field, message: `${field} must be a valid URL` });
      }
      
      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }
      
      // Custom validator
      if (rules.validate && !rules.validate(value)) {
        errors.push({ field, message: rules.message || `${field} is invalid` });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    next();
  };
};

// Transaction wrapper
const withTransaction = (handler) => {
  return async (req, res, next) => {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      req.dbClient = client;
      req.useTransaction = true;
      
      await handler(req, res, next);
      
      if (!res.headersSent) {
        await client.query('COMMIT');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'TRANSACTION_ERROR',
            message: 'Operation failed'
          }
        });
      }
    } finally {
      client.release();
    }
  };
};

// Error logger
const errorLogger = async (err, req, res, next) => {
  try {
    await db.query(`
      INSERT INTO error_logs (user_id, organization_id, method, path, error_message, stack_trace, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      req.user?.id || null,
      req.organizationId || null,
      req.method,
      req.path,
      err.message,
      err.stack,
      req.ip,
      req.headers['user-agent']
    ]);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
  
  next(err);
};

// Activity logger
const logActivity = async (req, action, entityType, entityId, details = {}) => {
  try {
    await db.query(`
      INSERT INTO activity_logs (user_id, organization_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      req.user.id,
      req.organizationId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      req.ip,
      req.headers['user-agent']
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Pagination helper
const paginate = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Standardized response helpers
const successResponse = (res, data, meta = {}) => {
  res.json({
    success: true,
    data,
    meta
  });
};

const errorResponse = (res, code, message, details = null, statusCode = 400) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
};

// Sanitize HTML input
const sanitizeHtml = (html) => {
  if (!html) return html;
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};

// Rate limiter storage
const rateLimitStore = new Map();

// Simple rate limiter
const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100;
  const keyGenerator = options.keyGenerator || ((req) => req.ip);
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create record
    let record = rateLimitStore.get(key);
    if (!record || now - record.resetTime > windowMs) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
    }
    
    // Increment count
    record.count++;
    
    // Check limit
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      });
    }
    
    // Set headers
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', max - record.count);
    res.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    next();
  };
};

// Cleanup expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Every minute

module.exports = {
  validateOrganization,
  validateInput,
  withTransaction,
  errorLogger,
  logActivity,
  paginate,
  successResponse,
  errorResponse,
  sanitizeHtml,
  rateLimit
};

