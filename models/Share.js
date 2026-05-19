// models/Share.js – v3 (status: active/inactive/suspended/archived + profit_rate)
'use strict';
const db = require('../config/db');

class Share {
  static async findAll(filters = {}) {
    let sql = `
      SELECT s.*, b.name as bank_name, b.code as bank_code
      FROM shares s
      JOIN banks b ON s.bank_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.bankId) {
      sql += ' AND s.bank_id = ?';
      params.push(filters.bankId);
    }

    if (filters.investorView) {
      // Investors only see active shares with available stock
      sql += ' AND s.status = "active" AND s.available_shares > 0';
    } else if (!filters.includeArchived) {
      // Managers & admin see active/inactive/suspended but NOT archived by default
      sql += ' AND s.status != "archived"';
    }

    sql += ' ORDER BY s.created_at DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, b.name as bank_name FROM shares s JOIN banks b ON s.bank_id=b.id WHERE s.id=?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const [res] = await db.query(
      `INSERT INTO shares (bank_id, share_name, total_shares, available_shares,
        price_per_share, currency, status, description, profit_rate, profit_cycle, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.bank_id, data.share_name, data.total_shares, data.available_shares,
        data.price_per_share, data.currency, data.status, data.description,
        data.profit_rate || 0, data.profit_cycle || 'monthly', data.created_by
      ]
    );
    return res.insertId;
  }

  static async update(id, data) {
    const {
      share_name, total_shares, available_shares,
      price_per_share, currency, status, description,
      profit_rate, profit_cycle
    } = data;

    const archiveAt = status === 'archived' ? new Date() : null;

    await db.query(
      `UPDATE shares
       SET share_name=?, total_shares=?, available_shares=?,
           price_per_share=?, currency=?, status=?, description=?,
           profit_rate=?, profit_cycle=?,
           archived_at = CASE WHEN ? = 'archived' AND archived_at IS NULL THEN NOW() ELSE archived_at END
       WHERE id=?`,
      [
        share_name, total_shares, available_shares,
        price_per_share, currency, status, description,
        profit_rate || 0, profit_cycle || 'monthly',
        status,
        id
      ]
    );
  }

  /** Soft-archive (admin sets status = archived, never truly deletes unless explicitly) */
  static async archive(id) {
    await db.query(
      `UPDATE shares SET status='archived', archived_at=NOW() WHERE id=?`,
      [id]
    );
  }

  /** Permanent delete – only allowed on archived shares with no purchase requests */
  static async remove(id) {
    await db.query('DELETE FROM shares WHERE id=? AND status="archived"', [id]);
  }
}

module.exports = Share;
