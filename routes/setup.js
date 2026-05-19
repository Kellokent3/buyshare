// routes/setup.js – One-time password setup endpoint
// Only works when passwords are still PENDING (not yet seeded)
// Automatically disabled after first successful seed
'use strict';
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const db      = require('../config/db');

// POST /api/setup/seed-passwords
// Body: { secret: 'buyshare-setup' }
router.post('/seed-passwords', async (req, res) => {
  if (req.body.secret !== 'buyshare-setup')
    return res.status(403).json({ error: 'Forbidden' });

  const ACCOUNTS = [
    { email:'admin@buyshare.rw',   pw:'admin123'    },
    { email:'manager@bk.rw',       pw:'manager123'  },
    { email:'manager@equity.rw',   pw:'manager123'  },
    { email:'investor@example.rw', pw:'investor123' },
    { email:'diane@example.rw',    pw:'investor123' },
  ];

  try {
    const [rows] = await db.query('SELECT id, email, password_hash FROM users');
    let seeded = 0;

    for (const row of rows) {
      const isPlaceholder = !row.password_hash || !row.password_hash.startsWith('$2');
      if (isPlaceholder) {
        const acct = ACCOUNTS.find(a => a.email === row.email);
        if (acct) {
          const hash = await bcrypt.hash(acct.pw, 10);
          await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, row.id]);
          seeded++;
        }
      }
    }

    res.json({
      success: true,
      seeded,
      message: seeded > 0 ? `Seeded ${seeded} passwords. You can now login.` : 'Passwords already set.',
      accounts: [
        { email:'admin@buyshare.rw',   role:'admin',        password:'admin123'    },
        { email:'manager@bk.rw',       role:'bank_manager', password:'manager123'  },
        { email:'investor@example.rw', role:'investor',     password:'investor123' },
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
