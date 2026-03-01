# BuyShare v2 – Setup Guide

## ⚡ Quick Start (3 steps)

```bash
# Step 1: Install packages
cd buyshare
npm install

# Step 2: Import database
mysql -u root -p < database.sql

# Step 3: Start (passwords auto-set on first start)
npm start
```

Open http://localhost:3000

## 🔑 Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@buyshare.rw | **admin123** |
| Bank Manager | manager@bk.rw | **manager123** |
| Investor | investor@example.rw | **investor123** |

> **Passwords are set automatically** when the server starts for the first time.
> You do NOT need to run `node seed.js` manually.

## 🐛 If "Invalid email or password" persists

The server may not have had time to seed passwords. Fix in 2 ways:

**Option A – Wait and retry**
The server logs `✅ Seeded 5 password(s)` after startup. 
Wait for that message, then refresh and login.

**Option B – Manual seed trigger**
```bash
curl -X POST http://localhost:3000/api/setup/seed-passwords \
  -H "Content-Type: application/json" \
  -d '{"secret":"buyshare-setup"}'
```
This returns the seeded accounts and you can login immediately.

## 🔧 Custom Port
```bash
PORT=4000 npm start
```
