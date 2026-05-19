// models/AuditLog.js
'use strict';
const db = require('../config/db');

class AuditLog {
  static async log(userId, action, entity, entityId, details = {}, ip = null) {
    try {
      await db.query(
        `INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, action, entity, entityId, JSON.stringify(details), ip]
      );
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  }
}

module.exports = AuditLog;