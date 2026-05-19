// routes/auth.js
'use strict';
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const { validate, handleValidation } = require('../config/validation'); // ✅ Iki ni cyo gikenewe!

// POST /api/auth/login
router.post('/login', 
  validate.login,
  handleValidation,
  async (req, res) => {
    const { email, password, role } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    try {
      const user = await User.findByEmailRole(email, role);

      if (!user) {
        await AuditLog.log(null, 'LOGIN_FAIL', 'users', null, { 
          email, 
          role,
          reason: 'user_not_found' 
        }, ip);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.isLocked()) {
        return res.status(423).json({ 
          error: 'Account locked. Try again in 15 minutes.' 
        });
      }

      if (!user.is_active) {
        const reason = user.deactivation_reason ? ` Reason: ${user.deactivation_reason}` : '';
        return res.status(403).json({ 
          error: 'Account deactivated. Contact administrator.' + reason,
          deactivation_reason: user.deactivation_reason || null
        });
      }

      const valid = await user.verifyPassword(password);
      
      if (!valid) {
        await user.recordFailedLogin();
        await AuditLog.log(user.id, 'LOGIN_FAIL', 'users', user.id, { 
          reason: 'wrong_password',
          attempts: user.login_attempts + 1
        }, ip);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      await user.resetLoginAttempts();

      req.session.regenerate(async (err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Session error' });
        }

        req.session.user = user.toSession();
        
        await AuditLog.log(user.id, 'LOGIN_SUCCESS', 'users', user.id, {}, ip);
        
        res.json({ 
          success: true, 
          user: req.session.user 
        });
      });

    } catch (err) {
      console.error('[login] Server error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/register
router.post('/register',
  validate.register,
  handleValidation,
  async (req, res) => {
    const { full_name, email, phone, password } = req.body;

    try {
      const exists = await User.findByEmail(email);
      if (exists) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const id = await User.create({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        password,
        role: 'investor',
      });

      await AuditLog.log(id, 'REGISTER', 'users', id, { 
        email: email.toLowerCase() 
      }, req.ip);

      res.status(201).json({ 
        success: true,
        message: 'Account created successfully' 
      });

    } catch (err) {
      console.error('[register] Error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  const userId = req.session.user?.id;
  const ip = req.ip;

  try {
    if (userId) {
      await AuditLog.log(userId, 'LOGOUT', 'users', userId, {}, ip);
    }
  } catch (err) {
    console.error('Logout audit error:', err);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.json({ user: req.session?.user || null });
});

module.exports = router;