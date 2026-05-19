// models/PurchaseRequest.js
'use strict';
const db = require('../config/db');
const Encryption = require('../config/security');

class PurchaseRequest {
  constructor(data) {
    this.id = data.id;
    this.investor_id = data.investor_id;
    this.share_id = data.share_id;
    this.quantity = data.quantity;
    this.price_per_share = data.price_per_share;
    this.total_amount = data.total_amount;
    this.amount_enc = data.amount_enc;
    this.status = data.status;
    this.rejection_reason = data.rejection_reason;
    this.reviewed_by = data.reviewed_by;
    this.reviewed_at = data.reviewed_at;
    this.created_at = data.created_at;
    this.investor_name = data.investor_name;
    this.investor_email = data.investor_email;
    this.share_name = data.share_name;
    this.bank_name = data.bank_name;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT pr.*, 
        u.full_name as investor_name, u.email as investor_email,
        s.share_name, b.name as bank_name, s.id as share_id, s.bank_id
       FROM purchase_requests pr
       JOIN users u ON pr.investor_id = u.id
       JOIN shares s ON pr.share_id = s.id
       JOIN banks b ON s.bank_id = b.id
       WHERE pr.id = ?`,
      [id]
    );
    if (!rows.length) return null;
    return new PurchaseRequest(rows[0]);
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT pr.*, 
        u.full_name as investor_name, u.email as investor_email,
        s.share_name, b.name as bank_name, s.price_per_share as share_price
      FROM purchase_requests pr
      JOIN users u ON pr.investor_id = u.id
      JOIN shares s ON pr.share_id = s.id
      JOIN banks b ON s.bank_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.investorId) {
      sql += ' AND pr.investor_id = ?';
      params.push(filters.investorId);
    }
    
    if (filters.bankId) {
      sql += ' AND s.bank_id = ?';
      params.push(filters.bankId);
    }
    
    sql += ' ORDER BY pr.created_at DESC';
    
    const [rows] = await db.query(sql, params);
    return rows;
  }

  verifyAmount() {
    try {
      const decrypted = Encryption.decrypt(this.amount_enc);
      return Number(decrypted) === Number(this.total_amount);
    } catch {
      return false;
    }
  }

  static async approve(id, reviewerId) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      
      await conn.query(
        `UPDATE purchase_requests 
         SET status='approved', reviewed_by=?, reviewed_at=NOW()
         WHERE id=? AND status='pending'`,
        [reviewerId, id]
      );
      
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = PurchaseRequest;