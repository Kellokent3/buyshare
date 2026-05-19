// seed.js – Run ONCE after: npm install && mysql < database.sql
// Usage: node seed.js
const bcrypt = require('bcryptjs');
const db     = require('./config/db');

async function seed() {
  const ROUNDS = 12;
  const hashes = {
    admin:    await bcrypt.hash('admin123',    ROUNDS),
    manager:  await bcrypt.hash('manager123',  ROUNDS),
    investor: await bcrypt.hash('investor123', ROUNDS),
  };

  await db.query('UPDATE users SET password_hash=? WHERE email=?', [hashes.admin,    'admin@buyshare.rw']);
  await db.query('UPDATE users SET password_hash=? WHERE email=?', [hashes.manager,  'manager@bk.rw']);
  await db.query('UPDATE users SET password_hash=? WHERE email=?', [hashes.manager,  'manager@equity.rw']);
  await db.query('UPDATE users SET password_hash=? WHERE email=?', [hashes.investor, 'investor@example.rw']);
  await db.query('UPDATE users SET password_hash=? WHERE email=?', [hashes.investor, 'diane@example.rw']);

  console.log('✅ Passwords seeded successfully!');
  console.log('   admin@buyshare.rw   → admin123');
  console.log('   manager@bk.rw       → manager123');
  console.log('   investor@example.rw → investor123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
