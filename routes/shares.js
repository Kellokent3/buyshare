// routes/shares.js – v3: status (active/inactive/suspended/archived), profit_rate, soft+hard delete
'use strict';
const express      = require('express');
const router       = express.Router();
const Share        = require('../models/Share');
const Notification = require('../models/Notification');
const AuditLog     = require('../models/AuditLog');
const db           = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const fmtNum = n => new Intl.NumberFormat().format(Math.round(Number(n) || 0));

// ── GET /api/shares ──────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, bank_id } = req.session.user;
    let shares;
    const includeArchived = req.query.archived === '1' && role === 'admin';

    if      (role === 'bank_manager') shares = await Share.findAll({ bankId: bank_id });
    else if (role === 'investor')     shares = await Share.findAll({ investorView: true });
    else                              shares = await Share.findAll({ includeArchived });
    res.json(shares);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/shares – create ────────────────────────────────
router.post('/', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const u = req.session.user;
    const {
      share_name, bank_id, total_shares, available_shares,
      price_per_share, currency, status, description,
      profit_rate, profit_cycle
    } = req.body;

    if (!share_name || !total_shares || !price_per_share)
      return res.status(400).json({ error: 'share_name, total_shares, price_per_share required' });

    const bid = u.role === 'bank_manager' ? u.bank_id : (Number(bank_id) || null);
    if (!bid) return res.status(400).json({ error: 'bank_id required' });

    const [[bank]] = await db.query('SELECT name FROM banks WHERE id=?', [bid]);
    const bankName = bank ? bank.name : 'Unknown Bank';
    const resolvedStatus = status || 'active';

    const id = await Share.create({
      bank_id: bid, share_name, total_shares,
      available_shares: available_shares || total_shares,
      price_per_share, currency: currency || 'RWF',
      status: resolvedStatus, description,
      profit_rate: Number(profit_rate) || 0,
      profit_cycle: profit_cycle || 'monthly',
      created_by: u.id,
    });

    // Notify investors only when share is active
    if (resolvedStatus === 'active') {
      const profitNote = Number(profit_rate) > 0
        ? ` — earning ${profit_rate}% ${profit_cycle || 'monthly'} profit per share`
        : '';
      Notification.broadcast({
        role: 'investor',
        title: '🆕 New Shares Available!',
        message: `${bankName} listed "${share_name}" — ${fmtNum(available_shares || total_shares)} shares at ${fmtNum(price_per_share)} RWF each${profitNote}. Check it out!`,
        type: 'success',
      }).catch(() => {});

      if (u.role === 'bank_manager') {
        Notification.broadcast({
          role: 'admin',
          title: '📈 New Share Listed',
          message: `${u.full_name} (${bankName}) listed "${share_name}" — ${fmtNum(total_shares)} shares at ${fmtNum(price_per_share)} RWF`,
          type: 'info',
        }).catch(() => {});
      }
    }

    AuditLog.log(u.id, 'CREATE_SHARE', 'shares', id, { share_name }, req.ip).catch(() => {});
    res.status(201).json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/shares/:id – update (managers + admin) ─────────
router.put('/:id', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const u = req.session.user;
    const {
      share_name, total_shares, available_shares, price_per_share,
      currency, status, description, profit_rate, profit_cycle,
      deactivation_reason,
    } = req.body;

    // Managers cannot set archived status – only admin can
    if (status === 'archived' && u.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can archive shares' });
    }

    // Fetch share BEFORE update to detect status change
    const shareBefore = await Share.findById(req.params.id);

    await Share.update(req.params.id, {
      share_name, total_shares, available_shares, price_per_share,
      currency, status, description,
      profit_rate: Number(profit_rate) || 0,
      profit_cycle: profit_cycle || 'monthly',
    });

    // ── Notify on deactivation (inactive / suspended) with reason ──
    const isDeactivation = (status === 'inactive' || status === 'suspended')
      && shareBefore && shareBefore.status === 'active';

    if (isDeactivation) {
      const reason = (deactivation_reason || '').trim();
      const reasonNote = reason ? ` Reason: ${reason}` : '';
      const shareData = await Share.findById(req.params.id);
      const sName = (shareData || {}).share_name || share_name;
      const bName = (shareData || {}).bank_name  || '';

      // Find all investors with approved or pending requests on this share
      const [affectedInvestors] = await db.query(
        `SELECT DISTINCT investor_id FROM purchase_requests
         WHERE share_id=? AND status IN ('approved','pending')`,
        [req.params.id]
      );
      for (const row of affectedInvestors) {
        Notification.create(
          row.investor_id,
          '⚠️ Share Deactivated',
          `"${sName}" (${bName}) has been deactivated and is no longer available.${reasonNote}`,
          'warning'
        ).catch(() => {});
      }

      // Notify the bank manager(s) who manage this share's bank
      if (shareBefore) {
        Notification.broadcast({
          role: 'bank_manager',
          bank_id: shareBefore.bank_id,
          excludeId: u.role === 'bank_manager' ? u.id : null,
          title: '⚠️ Share Deactivated',
          message: `Admin deactivated "${sName}".${reasonNote}`,
          type: 'warning',
        }).catch(() => {});
      }
    }

    // Notify investors when profit rate changes on an active share
    if (status === 'active' && Number(profit_rate) > 0) {
      const share = await Share.findById(req.params.id);
      if (share) {
        Notification.broadcast({
          role: 'investor',
          title: '💰 Profit Rate Updated',
          message: `"${share_name}" now offers ${profit_rate}% ${profit_cycle || 'monthly'} profit per share. Check your portfolio!`,
          type: 'success',
        }).catch(() => {});
      }
    }

    AuditLog.log(u.id, 'UPDATE_SHARE', 'shares', req.params.id, { status, profit_rate }, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/shares/:id/archive – soft archive (admin only) ─
router.patch('/:id/archive', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Share.archive(req.params.id);
    AuditLog.log(req.session.user.id, 'ARCHIVE_SHARE', 'shares', req.params.id, {}, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/shares/:id/unarchive – restore archived share (admin only) ─
router.patch('/:id/unarchive', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    await Share.unarchive(req.params.id);
    AuditLog.log(req.session.user.id, 'UNARCHIVE_SHARE', 'shares', req.params.id, {}, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/shares/:id ──────────────────────────────────────
// Admin: can delete archived shares (permanent, no purchase requests)
// Manager: can delete their own shares (if no purchase requests exist)
router.delete('/:id', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const u = req.session.user;
    const share = await Share.findById(req.params.id);
    if (!share) return res.status(404).json({ error: 'Share not found' });

    // Manager can only delete their own bank's shares
    if (u.role === 'bank_manager' && share.bank_id !== u.bank_id) {
      return res.status(403).json({ error: 'You can only delete shares from your own bank.' });
    }

    // Admin: must be archived first
    if (u.role === 'admin' && share.status !== 'archived') {
      return res.status(409).json({
        error: 'Only archived shares can be permanently deleted by admin. Archive it first.'
      });
    }

    // Check purchase requests
    const [rows] = await db.query(
      'SELECT COUNT(*) as cnt FROM purchase_requests WHERE share_id = ?',
      [req.params.id]
    );
    if (rows[0].cnt > 0) {
      return res.status(409).json({
        error: `Cannot delete: ${rows[0].cnt} purchase request(s) linked to this share.`
      });
    }

    await db.query('DELETE FROM shares WHERE id=?', [req.params.id]);
    AuditLog.log(u.id, 'DELETE_SHARE', 'shares', req.params.id, { role: u.role }, req.ip).catch(() => {});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
