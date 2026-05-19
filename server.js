// server.js – BuyShare v2 (FULLY FIXED)
'use strict';

// ============================================================
// IMPORTS
// ============================================================
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 2500;

// ============================================================
// DATABASE CONNECTION (DEFINED HERE FIRST!)
// ============================================================
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'buyshare_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
});

// ============================================================
// TEST DATABASE CONNECTION (NOW db IS DEFINED!)
// ============================================================
(async () => {
  try {
    const conn = await db.getConnection();
    console.log('✅ Database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Please check:');
    console.error('   - MySQL is running (XAMPP MySQL must be started)');
    console.error('   - Database exists (run: mysql -u root -p < database.sql)');
    console.error('   - Credentials in .env file are correct');
    process.exit(1);
  }
})();

// ============================================================
// MODELS (after db is defined)
// ============================================================
const Notification = require('./models/Notification');

// ============================================================
// AUTO-SEED PASSWORDS FUNCTION
// ============================================================
// AUTO-SEED PASSWORDS FUNCTION (with more logging)
async function autoSeedPasswords() {
  const ACCOUNTS = [
    { email: 'admin@buyshare.rw', pw: 'admin123' },
    { email: 'manager@bk.rw', pw: 'manager123' },
    { email: 'manager@equity.rw', pw: 'manager123' },
    { email: 'investor@example.rw', pw: 'investor123' },
    { email: 'diane@example.rw', pw: 'investor123' },
  ];
  
  try {
    console.log('🔍 Checking passwords...');
    
    // Check if users table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('❌ Users table not found! Did you run database.sql?');
      return;
    }
    
    const [rows] = await db.query('SELECT id, email, password_hash FROM users');
    console.log(`📊 Found ${rows.length} users in database`);
    
    if (rows.length === 0) {
      console.log('❌ No users found in database! Check database.sql');
      return;
    }
    
    let seeded = 0;
    for (const row of rows) {
      console.log(`  → ${row.email}: password_hash = ${row.password_hash ? row.password_hash.substring(0, 20) + '...' : 'NULL'}`);
      
      const isHashed = row.password_hash && 
                       row.password_hash.startsWith('$2') && 
                       row.password_hash.length >= 55;
      
      if (!isHashed) {
        const acct = ACCOUNTS.find(a => a.email === row.email);
        if (acct) {
          const hash = await bcrypt.hash(acct.pw, 12);
          await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.id]);
          seeded++;
          console.log(`  ✅ Password set for: ${row.email}`);
        } else {
          console.log(`  ⚠️ No account mapping for: ${row.email}`);
        }
      } else {
        console.log(`  ✓ Already hashed: ${row.email}`);
      }
    }
    
    if (seeded > 0) {
      console.log(`✅ Seeded ${seeded} password(s) successfully`);
    } else {
      console.log('✅ All passwords already set');
    }
  } catch (e) {
    console.error('⚠️ Auto-seed error:', e);
  }
}

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:2500"]
    }
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:2500'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.set('trust proxy', 1);

// Rate limiting
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  standardHeaders: true, 
  legacyHeaders: false 
}));

app.use('/api/auth/login', rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 30, 
  message: { error: 'Too many attempts. Try in 15 min.' } 
}));

app.use('/api/auth/register', rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { error: 'Too many registration attempts.' } 
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'buyshare-v2-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 8 * 60 * 60 * 1000,
    httpOnly: true, 
    sameSite: 'lax',
    secure: false,
  }
}));

// ============================================================
// STATIC FILES & ROUTES
// ============================================================
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '0' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shares', require('./routes/shares'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/banks', require('./routes/banks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/setup', require('./routes/setup'));

// 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch-all for frontend (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err.stack);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
  try {
    await autoSeedPasswords();
    
    app.listen(PORT, () => {
      console.log('\n🏦  BuyShare v2 → http://localhost:' + PORT);
      console.log('────────────────────────────────────────');
      console.log('  admin@buyshare.rw    → admin123');
      console.log('  manager@bk.rw        → manager123');
      console.log('  investor@example.rw  → investor123');
      console.log('────────────────────────────────────────\n');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

// Export for routes to use
module.exports = { app, db };