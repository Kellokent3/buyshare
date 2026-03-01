// routes/users.js
'use strict';
const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/',    requireAuth, requireRole('admin'), async (req, res) => {
  try { res.json(await User.findAll()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/',   requireAuth, requireRole('admin'), async (req, res) => {
  const { full_name, email, phone, password, role, bank_id } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email required' });
  try {
    const id = await User.create({ full_name, email: email.toLowerCase(), phone, password: password || 'manager123', role: role || 'bank_manager', bank_id });
    await AuditLog.log(req.session.user.id, 'CREATE_USER', 'users', id, { email, role }, req.ip);
    res.status(201).json({ success: true, id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { full_name, phone, role, bank_id, is_active } = req.body;
    await User.update(req.params.id, { full_name, phone, role, bank_id, is_active });
    await AuditLog.log(req.session.user.id, 'UPDATE_USER', 'users', req.params.id, {}, req.ip);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  if (parseInt(req.params.id) === req.session.user.id)
    return res.status(400).json({ error: 'Cannot deactivate yourself' });
  try {
    await User.deactivate(req.params.id);
    await AuditLog.log(req.session.user.id, 'DEACTIVATE_USER', 'users', req.params.id, {}, req.ip);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
