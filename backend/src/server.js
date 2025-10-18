const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Organization detection middleware
app.use((req, res, next) => {
  const hostname = req.hostname;
  const domainOrgMap = {
    'sitepandaseo.com': 'sitepanda',
    'ducrm.com': 'du',
    'my.logicinbound.com': 'li'
  };
  
  req.organizationSlug = domainOrgMap[hostname] || req.headers['x-organization'] || 'sitepanda';
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const opportunityRoutes = require('./routes/opportunities');
const noteRoutes = require('./routes/notes');
const integrationRoutes = require('./routes/integrations');
const webhookRoutes = require('./routes/webhooks');
const outgoingWebhookRoutes = require('./routes/outgoing-webhooks');
const sopPagesRoutes = require('./routes/sop-pages');
const sopCategoriesRoutes = require('./routes/sop-categories');
const calendarRoutes = require('./routes/calendar');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/:org/clients', clientRoutes);
app.use('/api/v1/:org/projects', projectRoutes);
app.use('/api/v1/:org/opportunities', opportunityRoutes);
app.use('/api/v1/:org/notes', noteRoutes);
app.use('/api/v1/:org/integrations', integrationRoutes);
app.use('/api/v1/:org/webhooks', webhookRoutes);
app.use('/api/v1/:org/outgoing-webhooks', outgoingWebhookRoutes);
app.use('/api/v1/:org/monitoring', monitoringRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/:org/sop', sopPagesRoutes);
app.use('/api/v1/:org/sop-categories', sopCategoriesRoutes);
app.use('/api/v1/:org/calendar', calendarRoutes);

// Public webhook receiver
const webhookReceiverRoutes = require('./routes/webhook-receiver');
app.use('/webhook', webhookReceiverRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Unified Ops Platform API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Version: ${process.env.API_VERSION || 'v1'}`);
});

module.exports = app;

