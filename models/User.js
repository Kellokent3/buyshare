// models/User.js
'use strict';
const bcrypt = require('bcryptjs');
const db = require('../config/db');

class User {
  constructor(data) {
    this.id = data.id;
    this.full_name = data.full_name;
    this.email = data.email;
    this.phone = data.phone;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.bank_id = data.bank_id;
    this.bank_name = data.bank_name;
    this.is_active = data.is_active;
    this.deactivation_reason = data.deactivation_reason;
    this.login_attempts = data.login_attempts;
    this.locked_until = data.locked_until;
    this.created_at = data.created_at;
  }
// models/User.js - Ongeraho iyi method

static async findByEmail(email) {
  const [rows] = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email.toLowerCase()]
  );
  return rows.length > 0 ? rows[0] : null;
}
  static async findByEmailRole(email, role) {
    const [rows] = await db.query(
      `SELECT u.*, b.name as bank_name 
       FROM users u 
       LEFT JOIN banks b ON u.bank_id = b.id 
       WHERE u.email = ? AND u.role = ?`,
      [email, role]
    );
    if (!rows.length) return null;
    return new User(rows[0]);
  }
  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  isLocked() {
    return this.locked_until && new Date(this.locked_until) > new Date();
  }

  async recordFailedLogin() {
    const attempts = this.login_attempts + 1;
    if (attempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await db.query(
        'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockedUntil, this.id]
      );
    } else {
      await db.query(
        'UPDATE users SET login_attempts = ? WHERE id = ?',
        [attempts, this.id]
      );
    }
  }

  async resetLoginAttempts() {
    await db.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
      [this.id]
    );
  }

  toSession() {
    return {
      id: this.id,
      full_name: this.full_name,
      email: this.email,
      role: this.role,
      bank_id: this.bank_id,
      bank_name: this.bank_name,
    };
  }

  static async create(data) {
    const hash = await bcrypt.hash(data.password, 10);
    const [res] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, bank_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.full_name, data.email, data.phone || null, hash, data.role, data.bank_id || null]
    );
    return res.insertId;
  }

  static async findAll() {
    const [rows] = await db.query(
      `SELECT u.*, b.name as bank_name 
       FROM users u 
       LEFT JOIN banks b ON u.bank_id = b.id 
       ORDER BY u.created_at DESC`
    );
    return rows;
  }

  static async update(id, data) {
    const { full_name, phone, role, bank_id, is_active } = data;
    await db.query(
      `UPDATE users SET full_name=?, phone=?, role=?, bank_id=?, is_active=?
       WHERE id=?`,
      [full_name, phone, role, bank_id, is_active, id]
    );
  }

  static async deactivate(id, reason) {
    await db.query('UPDATE users SET is_active=0, deactivation_reason=? WHERE id=?', [reason || null, id]);
  }

  static async activate(id) {
    await db.query('UPDATE users SET is_active=1, deactivation_reason=NULL WHERE id=?', [id]);
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT u.*, b.name as bank_name FROM users u LEFT JOIN banks b ON u.bank_id=b.id WHERE u.id=?`,
      [id]
    );
    if (!rows.length) return null;
    return new User(rows[0]);
  }
}


module.exports = User;