// routes/notifications.js
'use strict';
const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

// GET /api/notifications – get user's notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await Notification.findByUser(req.session.user.id, 40);
    res.json(rows);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.markAllRead(req.session.user.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/notifications/:id/read – mark one as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    await Notification.markOneRead(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const count = await Notification.unreadCount(req.session.user.id);
    res.json({ count });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/notifications/:id - gusiba notif imwe
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Notification.deleteOne(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch(err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// DELETE /api/notifications/read/all - gusiba notif zose zisomwe
router.delete('/read/all', requireAuth, async (req, res) => {
  try {
    await Notification.deleteAllRead(req.session.user.id);
    res.json({ success: true });
  } catch(err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
