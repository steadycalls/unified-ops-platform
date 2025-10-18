const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.use(authorize('member'));
router.get('/events', (req, res) => res.json({ events: [] }));
module.exports = router;
