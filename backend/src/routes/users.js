const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
router.get('/', authorize('admin'), (req, res) => res.json({ users: [] }));
module.exports = router;
