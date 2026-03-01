// routes/requests.js – Atomic transactions + full notifications
'use strict';
const express         = require('express');
const router          = express.Router();
const db              = require('../config/db');
const Encryption      = require('../config/security');
const PurchaseRequest = require('../models/PurchaseRequest');
const Notification    = require('../models/Notification');
const AuditLog        = require('../models/AuditLog');
const { requireAuth, requireRole } = require('../middleware/auth');

const fmtNum = n => new Intl.NumberFormat().format(Math.round(Number(n)||0));

// ── GET /api/requests ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { role, id, bank_id } = req.session.user;
    const filter = {};
    if      (role === 'investor')     filter.investorId = id;
    else if (role === 'bank_manager') filter.bankId = bank_id;
    // admin: no filter = sees everything
    res.json(await PurchaseRequest.findAll(filter));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/requests (investor submits purchase request) ────
router.post('/', requireAuth, requireRole('investor'), async (req, res) => {
  const { share_id, quantity } = req.body;
  const investor = req.session.user;

  if (!share_id || !quantity || Number(quantity) < 1)
    return res.status(400).json({ error: 'share_id and quantity (min 1) are required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the share row to prevent race conditions
    const [shareRows] = await conn.query(
      `SELECT s.*, b.name AS bank_name, b.id AS bank_id
       FROM shares s JOIN banks b ON s.bank_id=b.id
       WHERE s.id=? AND s.status='active' FOR UPDATE`,
      [share_id]
    );
    if (!shareRows.length) throw new Error('Share not found or not available');

    const share = shareRows[0];
    const qty   = Math.floor(Number(quantity));
    if (qty < 1) throw new Error('Quantity must be at least 1');
    if (qty > share.available_shares)
      throw new Error(`Only ${share.available_shares} shares available`);

    const price_per_share = Number(share.price_per_share);
    const total_amount    = qty * price_per_share;

    // Encrypt the amount for storage security (at rest)
    const amount_enc = Encryption.encrypt(String(total_amount));

    // Insert the purchase request INSIDE the same transaction
    const [insertResult] = await conn.query(
      `INSERT INTO purchase_requests
        (investor_id, share_id, quantity, price_per_share, total_amount, amount_enc, status)
       VALUES (?,?,?,?,?,?,'pending')`,
      [investor.id, share_id, qty, price_per_share, total_amount, amount_enc]
    );
    const reqId = insertResult.insertId;

    // Deduct available shares
    await conn.query(
      'UPDATE shares SET available_shares = available_shares - ? WHERE id=?',
      [qty, share_id]
    );

    await conn.commit();

    // ── NOTIFICATIONS ──────────────────────────────────────────
    // (After commit – non-blocking, failures don't affect the request)

    // 1. Investor: confirmation
    Notification.create(
      investor.id,
      '📋 Request Received',
      `Your request to buy ${qty} shares of "${share.share_name}" (${fmtNum(total_amount)} RWF) was received and is pending approval.`,
      'info'
    ).catch(() => {});

    // 2. Bank manager(s) of the share's bank: new request alert
    Notification.broadcast({
      role: 'bank_manager',
      bank_id: share.bank_id,
      title: '🔔 New Purchase Request',
      message: `${investor.full_name} wants to buy ${qty} shares of "${share.share_name}" — ${fmtNum(total_amount)} RWF. Please review.`,
      type: 'warning',
    }).catch(() => {});

    // 3. All admins: awareness
    Notification.broadcast({
      role: 'admin',
      title: '📥 New Purchase Request',
      message: `${investor.full_name} → ${qty} × "${share.share_name}" (${share.bank_name}) — ${fmtNum(total_amount)} RWF`,
      type: 'info',
    }).catch(() => {});

    AuditLog.log(investor.id, 'CREATE_REQUEST', 'purchase_requests', reqId,
      { share_id, quantity: qty, total_amount }, req.ip).catch(() => {});

    res.status(201).json({ success: true, id: reqId, total_amount });

  } catch (err) {
    await conn.rollback().catch(() => {});
    const status = err.message.includes('not found') || err.message.includes('available') ? 400 : 500;
    res.status(status).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── PUT /api/requests/:id/approve ─────────────────────────────
router.put('/:id/approve', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    // Integrity check: decrypt stored amount and compare
    if (!request.verifyAmount())
      return res.status(409).json({ error: 'Amount integrity check failed — contact admin' });

    await PurchaseRequest.approve(req.params.id, req.session.user.id);

    // ── NOTIFICATIONS ──────────────────────────────────────────

    // 1. Investor: approved
    Notification.create(
      request.investor_id,
      '✅ Request Approved!',
      `Congratulations! Your request to buy ${request.quantity} shares of "${request.share_name}" (${fmtNum(request.total_amount)} RWF) has been APPROVED.`,
      'success'
    ).catch(() => {});

    // 2. Admins (if approved by manager) / Manager (if approved by admin)
    if (req.session.user.role === 'bank_manager') {
      Notification.broadcast({
        role: 'admin',
        title: '✅ Request Approved',
        message: `${req.session.user.full_name} approved ${request.investor_name}'s request: ${request.quantity} × "${request.share_name}" — ${fmtNum(request.total_amount)} RWF`,
        type: 'success',
      }).catch(() => {});
    }

    AuditLog.log(req.session.user.id, 'APPROVE_REQUEST', 'purchase_requests', req.params.id,
      { investor: request.investor_name }, req.ip).catch(() => {});

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/requests/:id/reject ──────────────────────────────
router.put('/:id/reject', requireAuth, requireRole('bank_manager', 'admin'), async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim())
    return res.status(400).json({ error: 'Rejection reason is required' });

  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE purchase_requests SET status='rejected', rejection_reason=?,
         reviewed_by=?, reviewed_at=NOW() WHERE id=? AND status='pending'`,
        [reason.trim(), req.session.user.id, req.params.id]
      );
      // Restore the shares back
      await conn.query(
        'UPDATE shares SET available_shares = available_shares + ? WHERE id=?',
        [request.quantity, request.share_id]
      );
      await conn.commit();
    } catch(e) {
      await conn.rollback().catch(() => {});
      throw e;
    } finally {
      conn.release();
    }

    // ── NOTIFICATIONS ──────────────────────────────────────────

    // 1. Investor: rejected with reason
    Notification.create(
      request.investor_id,
      '❌ Request Rejected',
      `Your request to buy "${request.share_name}" was rejected. Reason: "${reason.trim()}"`,
      'danger'
    ).catch(() => {});

    // 2. Admins (if rejected by manager)
    if (req.session.user.role === 'bank_manager') {
      Notification.broadcast({
        role: 'admin',
        title: '❌ Request Rejected',
        message: `${req.session.user.full_name} rejected ${request.investor_name}'s request for "${request.share_name}". Reason: ${reason.trim()}`,
        type: 'danger',
      }).catch(() => {});
    }

    AuditLog.log(req.session.user.id, 'REJECT_REQUEST', 'purchase_requests', req.params.id,
      { reason: reason.trim() }, req.ip).catch(() => {});

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
