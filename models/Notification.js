// models/Notification.js – Complete notification system
'use strict';
const db = require('../config/db');

class Notification {
  // Create notification for one specific user
  static async create(userId, title, message, type = 'info') {
    if (!userId) return null;
    try {
      const [r] = await db.query(
        'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)',
        [userId, title, message, type]
      );
      return r.insertId;
    } catch(e) {
      console.error('[Notif.create]', e.message);
      return null;
    }
  }
// models/Notification.js - Ongeraho iyi method

static async deleteOne(id, userId) {
  await db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId]
  );
}

static async deleteAllRead(userId) {
  await db.query(
    'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
    [userId]
  );
}
  // Broadcast to ALL users with a given role (optionally scoped to bank_id)
  static async broadcast({ role, bank_id = null, excludeId = null, title, message, type = 'info' }) {
    try {
      let sql = 'SELECT id FROM users WHERE is_active=1 AND role=?';
      const p = [role];
      if (bank_id)   { sql += ' AND bank_id=?'; p.push(bank_id); }
      if (excludeId) { sql += ' AND id!=?';     p.push(excludeId); }
      const [rows] = await db.query(sql, p);
      for (const row of rows) {
        await Notification.create(row.id, title, message, type);
      }
      return rows.length;
    } catch(e) {
      console.error('[Notif.broadcast]', e.message);
      return 0;
    }
  }

  // Get notifications for a user (newest first)
  static async findByUser(userId, limit = 30) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }

  static async markAllRead(userId) {
    await db.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [userId]);
  }

  static async markOneRead(notifId, userId) {
    await db.query('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [notifId, userId]);
  }

  static async unreadCount(userId) {
    const [[row]] = await db.query(
      'SELECT COUNT(*) cnt FROM notifications WHERE user_id=? AND is_read=0', [userId]
    );
    return Number(row.cnt);
  }

  // Daily report summary for admins (called once per day via server timer)
  static async sendAdminDailySummary() {
    try {
      const db2 = require('../config/db');
      const [[totals]] = await db2.query(`
        SELECT
          (SELECT COUNT(*) FROM purchase_requests WHERE DATE(created_at)=CURDATE()) AS today_requests,
          (SELECT COUNT(*) FROM purchase_requests WHERE status='pending') AS pending,
          (SELECT COUNT(*) FROM purchase_requests WHERE status='approved' AND DATE(reviewed_at)=CURDATE()) AS approved_today,
          (SELECT COALESCE(SUM(total_amount),0) FROM purchase_requests WHERE status='approved' AND DATE(reviewed_at)=CURDATE()) AS volume_today,
          (SELECT COUNT(*) FROM users WHERE DATE(created_at)=CURDATE()) AS new_users
      `);
      const msg =
        `📈 Today: ${totals.today_requests} new requests | ` +
        `✅ ${totals.approved_today} approved | ` +
        `⏳ ${totals.pending} pending | ` +
        `💰 ${new Intl.NumberFormat().format(Math.round(totals.volume_today))} RWF volume | ` +
        `👤 ${totals.new_users} new users`;
      await Notification.broadcast({
        role: 'admin',
        title: '📊 Daily Report Summary',
        message: msg,
        type: 'info',
      });
    } catch(e) {
      console.error('[DailySummary]', e.message);
    }
  }
}

module.exports = Notification;
