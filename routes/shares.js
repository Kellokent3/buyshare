// routes/shares.js – With new-share notifications
'use strict';
const express      = require('express');
const router       = express.Router();
const Share        = require('../models/Share');
const Notification = require('../models/Notification');
const AuditLog     = require('../models/AuditLog');
const db           = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const fmtNum = n => new Intl.NumberFormat().format(Math.round(Number(n)||0));

// GET /api/shares
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, bank_id } = req.session.user;
    let shares;
    if      (role === 'bank_manager') shares = await Share.findAll({ bankId: bank_id });
    else if (role === 'investor')     shares = await Share.findAll({ investorView: true });
    else                              shares = await Share.findAll();
    res.json(shares);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/shares – create + notify investors and admins
router.post('/', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const u = req.session.user;
    const { share_name, bank_id, total_shares, available_shares, price_per_share, currency, status, description } = req.body;
    if (!share_name || !total_shares || !price_per_share)
      return res.status(400).json({ error: 'share_name, total_shares, price_per_share required' });

    const bid = u.role === 'bank_manager' ? u.bank_id : (Number(bank_id) || null);
    if (!bid) return res.status(400).json({ error: 'bank_id required' });

    // Get bank name for notification
    const [[bank]] = await db.query('SELECT name FROM banks WHERE id=?', [bid]);
    const bankName = bank ? bank.name : 'Unknown Bank';

    const id = await Share.create({
      bank_id: bid, share_name, total_shares, available_shares,
      price_per_share, currency: currency || 'RWF',
      status: status || 'active', description, created_by: u.id,
    });

    // ── NOTIFICATIONS (only if share is active) ──────────────
    if ((status || 'active') === 'active') {
      // All investors: new share available
      Notification.broadcast({
        role: 'investor',
        title: '🆕 New Shares Available!',
        message: `${bankName} listed "${share_name}" — ${fmtNum(available_shares)} shares at ${fmtNum(price_per_share)} RWF each. Check it out!`,
        type: 'success',
      }).catch(() => {});

      // All admins (if created by manager)
      if (u.role === 'bank_manager') {
        Notification.broadcast({
          role: 'admin',
          title: '📈 New Share Listed',
          message: `${u.full_name} (${bankName}) listed "${share_name}" — ${fmtNum(total_shares)} total shares at ${fmtNum(price_per_share)} RWF`,
          type: 'info',
        }).catch(() => {});
      }
    }

    AuditLog.log(u.id, 'CREATE_SHARE', 'shares', id, { share_name }, req.ip).catch(() => {});
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/shares/:id
router.put('/:id', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const { share_name, total_shares, available_shares, price_per_share, currency, status, description } = req.body;
    await Share.update(req.params.id, { share_name, total_shares, available_shares, price_per_share, currency, status, description });
    AuditLog.log(req.session.user.id, 'UPDATE_SHARE', 'shares', req.params.id, {}, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/shares/:id (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Share.remove(req.params.id);
    AuditLog.log(req.session.user.id, 'DELETE_SHARE', 'shares', req.params.id, {}, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
