const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify session exists and is valid
    const sessionResult = await db.query(
      'SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get user details
    const userResult = await db.query(
      'SELECT id, email, full_name, is_super_admin, is_active FROM users WHERE id = $1 AND is_active = TRUE',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const authorize = (requiredRole = 'member') => {
  const roleHierarchy = { viewer: 0, member: 1, manager: 2, admin: 3 };
  
  return async (req, res, next) => {
    try {
      const orgSlug = req.params.org || req.organizationSlug;
      
      // Super admins bypass all checks
      if (req.user.is_super_admin) {
        req.userRole = 'admin';
        req.userPermissions = { all: true };
        return next();
      }

      // Get user's role in this organization
      const roleResult = await db.query(`
        SELECT uor.role, uor.permissions
        FROM user_organization_roles uor
        JOIN organizations o ON uor.organization_id = o.id
        WHERE uor.user_id = $1 AND o.slug = $2
      `, [req.user.id, orgSlug]);

      if (roleResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      const userRole = roleResult.rows[0].role;
      const userPermissions = roleResult.rows[0].permissions;

      // Check role hierarchy
      if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = userRole;
      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

const checkPermission = (entity, action) => {
  return (req, res, next) => {
    if (req.user.is_super_admin) {
      return next();
    }

    const permissions = req.userPermissions;
    
    if (permissions.all || (permissions[entity] && permissions[entity][action])) {
      return next();
    }

    return res.status(403).json({ error: `Permission denied: ${entity}.${action}` });
  };
};

module.exports = {
  authenticate,
  authorize,
  checkPermission
};

