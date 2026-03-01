// routes/banks.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM banks WHERE is_active=1 ORDER BY name');
  res.json(rows);
});

module.exports = router;
