// models/Share.js
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
      sql += ' AND s.status = "active" AND s.available_shares > 0';
    }
    
    sql += ' ORDER BY s.created_at DESC';
    
    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async create(data) {
    const [res] = await db.query(
      `INSERT INTO shares (bank_id, share_name, total_shares, available_shares, 
        price_per_share, currency, status, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.bank_id, data.share_name, data.total_shares, data.available_shares,
       data.price_per_share, data.currency, data.status, data.description, data.created_by]
    );
    return res.insertId;
  }

  static async update(id, data) {
    const { share_name, total_shares, available_shares, price_per_share, currency, status, description } = data;
    await db.query(
      `UPDATE shares 
       SET share_name=?, total_shares=?, available_shares=?, price_per_share=?, currency=?, status=?, description=?
       WHERE id=?`,
      [share_name, total_shares, available_shares, price_per_share, currency, status, description, id]
    );
  }

  static async remove(id) {
    await db.query('DELETE FROM shares WHERE id=?', [id]);
  }
}

module.exports = Share;