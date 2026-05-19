// routes/stats.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const q = (sql, p = []) => db.query(sql, p).then(([r]) => r[0]);

router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, id, bank_id } = req.session.user;
    let stats = {};

    if (role === 'admin') {
      stats = {
        total_users:      (await q("SELECT COUNT(*) v FROM users WHERE is_active=1")).v,
        total_managers:   (await q("SELECT COUNT(*) v FROM users WHERE role='bank_manager' AND is_active=1")).v,
        total_investors:  (await q("SELECT COUNT(*) v FROM users WHERE role='investor' AND is_active=1")).v,
        total_shares:     (await q("SELECT COUNT(*) v FROM shares WHERE status='active'")).v,
        pending_requests: (await q("SELECT COUNT(*) v FROM purchase_requests WHERE status='pending'")).v,
        total_volume:     (await q("SELECT COALESCE(SUM(total_amount),0) v FROM purchase_requests WHERE status='approved'")).v,
      };
    } else if (role === 'bank_manager') {
      stats = {
        my_shares:   (await q("SELECT COUNT(*) v FROM shares WHERE bank_id=? AND status='active'", [bank_id])).v,
        my_available:(await q("SELECT COUNT(*) v FROM shares WHERE bank_id=? AND status='active' AND available_shares > 0", [bank_id])).v,
        pending:     (await q("SELECT COUNT(*) v FROM purchase_requests pr JOIN shares s ON pr.share_id=s.id WHERE s.bank_id=? AND pr.status='pending'", [bank_id])).v,
        approved:    (await q("SELECT COUNT(*) v FROM purchase_requests pr JOIN shares s ON pr.share_id=s.id WHERE s.bank_id=? AND pr.status='approved'", [bank_id])).v,
        revenue:     (await q("SELECT COALESCE(SUM(pr.total_amount),0) v FROM purchase_requests pr JOIN shares s ON pr.share_id=s.id WHERE s.bank_id=? AND pr.status='approved'", [bank_id])).v,
      };
    } else {
      stats = {
        my_requests: (await q("SELECT COUNT(*) v FROM purchase_requests WHERE investor_id=?", [id])).v,
        approved:    (await q("SELECT COUNT(*) v FROM purchase_requests WHERE investor_id=? AND status='approved'", [id])).v,
        invested:    (await q("SELECT COALESCE(SUM(total_amount),0) v FROM purchase_requests WHERE investor_id=? AND status='approved'", [id])).v,
        unread:      (await q("SELECT COUNT(*) v FROM notifications WHERE user_id=? AND is_read=0", [id])).v,
      };
    }
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/reports', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const { role, bank_id } = req.session.user;
    const W = role === 'bank_manager' ? 'WHERE s.bank_id=?' : '';
    const P = role === 'bank_manager' ? [bank_id] : [];

    const [byStatus] = await db.query(
      `SELECT pr.status, COUNT(*) cnt, COALESCE(SUM(pr.total_amount),0) total
       FROM purchase_requests pr JOIN shares s ON pr.share_id=s.id ${W} GROUP BY pr.status`, P);

    const [topShares] = await db.query(
      `SELECT s.share_name, b.name bank_name, COUNT(pr.id) requests,
              COALESCE(SUM(CASE WHEN pr.status='approved' THEN pr.quantity ELSE 0 END),0) sold,
              COALESCE(SUM(CASE WHEN pr.status='approved' THEN pr.total_amount ELSE 0 END),0) revenue
       FROM purchase_requests pr JOIN shares s ON pr.share_id=s.id JOIN banks b ON s.bank_id=b.id
       ${W} GROUP BY s.id ORDER BY revenue DESC LIMIT 5`, P);

    res.json({ byStatus, topShares });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
