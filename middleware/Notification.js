// models/Notification.js
'use strict';
const db = require('../config/db');

class Notification {
  static async create(userId, title, message, type = 'info') {
    const [res] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [userId, title, message, type]
    );
    return res.insertId;
  }

  static async broadcast({ role, bank_id = null, title, message, type = 'info' }) {
    try {
      let query = 'SELECT id FROM users WHERE role = ? AND is_active = 1';
      const params = [role];
      
      if (bank_id) {
        query += ' AND bank_id = ?';
        params.push(bank_id);
      }
      
      const [users] = await db.query(query, params);
      
      for (const user of users) {
        await Notification.create(user.id, title, message, type);
      }
    } catch (err) {
      console.error('Broadcast error:', err.message);
    }
  }

  static async findByUser(userId, limit = 50) {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  static async markAllRead(userId) {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );
  }

  static async markOneRead(id, userId) {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  static async unreadCount(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0].count;
  }

  static async sendAdminDailySummary() {
    try {
      const [stats] = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role='investor' AND is_active=1) as investors,
          (SELECT COUNT(*) FROM purchase_requests WHERE DATE(created_at)=CURDATE()) as requests_today,
          (SELECT COUNT(*) FROM purchase_requests WHERE status='pending') as pending_requests
      `);
      
      const [admins] = await db.query('SELECT id FROM users WHERE role = "admin" AND is_active = 1');
      
      const message = `📊 Daily Summary: ${stats[0].investors} investors, ${stats[0].requests_today} requests today, ${stats[0].pending_requests} pending.`;
      
      for (const admin of admins) {
        await Notification.create(admin.id, '📈 Daily Summary', message, 'info');
      }
    } catch (err) {
      console.error('Daily summary error:', err.message);
    }
  }
}

module.exports = Notification;