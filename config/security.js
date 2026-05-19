// config/security.js – AES-256-GCM for data at rest
'use strict';
const crypto = require('crypto');

const ALGO  = 'aes-256-gcm';
// 32-byte key from env or deterministic fallback (set ENV in production!)
const KEY   = Buffer.from(
  process.env.ENCRYPT_KEY || 'buyshare_secure_key_32bytes_ok!!',
  'utf8'
).slice(0, 32);

class Encryption {
  /** Encrypt plaintext → "iv:authTag:ciphertext" (base64) */
  static encrypt(plaintext) {
    const iv        = crypto.randomBytes(12);
    const cipher    = crypto.createCipheriv(ALGO, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const authTag   = cipher.getAuthTag();
    return [iv, authTag, encrypted].map(b => b.toString('base64')).join(':');
  }

  /** Decrypt "iv:authTag:ciphertext" → plaintext string */
  static decrypt(encoded) {
    try {
      const [ivB64, tagB64, encB64] = encoded.split(':');
      const iv        = Buffer.from(ivB64,  'base64');
      const authTag   = Buffer.from(tagB64, 'base64');
      const enc       = Buffer.from(encB64, 'base64');
      const decipher  = crypto.createDecipheriv(ALGO, KEY, iv);
      decipher.setAuthTag(authTag);
      return decipher.update(enc) + decipher.final('utf8');
    } catch { return null; }
  }
}

module.exports = Encryption;
