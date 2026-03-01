// models/AuditLog.js
'use strict';
const db = require('../config/db');

class AuditLog {
  static async log(userId, action, entity, entityId, details, ip) {
    await db.query(
      'INSERT INTO audit_log (user_id,action,entity,entity_id,details,ip_address) VALUES (?,?,?,?,?,?)',
      [userId || null, action, entity || null, entityId || null, details ? JSON.stringify(details) : null, ip || null]
    ).catch(() => {}); // never crash the request
  }
}

module.exports = AuditLog;
