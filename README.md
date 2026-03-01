# 🏦 BuyShare v2 – Secure Share Investment Platform

**Node.js + MySQL + Glassmorphism UI | Dark/Light + ENG/KIN**

## 📁 Project Structure
```
buyshare/
├── server.js              ← Express app + security middleware
├── seed.js                ← Set real bcrypt passwords (run once)
├── database.sql           ← MySQL schema + seed data
├── package.json           ← Dependencies (run npm install)
├── config/
│   ├── db.js              ← MySQL pool
│   └── security.js        ← AES-256-GCM encryption (at rest)
├── middleware/
│   └── auth.js            ← Session auth guards
├── models/                ← OOP classes
│   ├── User.js
│   ├── Share.js
│   ├── PurchaseRequest.js
│   ├── Notification.js
│   └── AuditLog.js
├── routes/                ← REST API endpoints
│   ├── auth.js
│   ├── shares.js
│   ├── requests.js
│   ├── users.js
│   ├── banks.js
│   ├── notifications.js
│   └── stats.js
└── public/                ← Frontend SPA
    ├── index.html
    ├── styles.css
    └── app.js
```

## ⚙️ Setup (Phase 2 – install & run)

```bash
# 1. Install dependencies
cd buyshare && npm install

# 2. Create database
mysql -u root -p < database.sql

# 3. Set real bcrypt passwords (IMPORTANT!)
node seed.js

# 4. Start server
npm start

or

pm2 resurrect
# → http://localhost:2500
```

### Optional: env vars
```bash
DB_HOST=localhost  DB_USER=root  DB_PASS=yourpass
DB_NAME=buyshare_db  PORT=3000
SESSION_SECRET=your-secret-here
ENCRYPT_KEY=your-32-char-key-here!!
```

## 👤 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@buyshare.rw | admin123 |
| **Bank Manager** | manager@bk.rw | manager123 |
| **Investor** | investor@example.rw | investor123 |

## 🔒 Security Features
| Layer | Method |
|-------|--------|
| **Passwords** | bcrypt (12 rounds) |
| **Data at rest** | AES-256-GCM encrypted `amount_enc` |
| **In transit** | Helmet security headers, HTTPS-ready |
| **Sessions** | httpOnly + sameSite cookies |
| **Rate limiting** | 20 login attempts / 15 min |
| **Account lockout** | 5 failed → locked 15 min |
| **SQL injection** | Parameterized queries (mysql2) |
| **CSRF** | sameSite:strict cookie |
| **Audit log** | All actions tracked |
| **Transactions** | DB transactions on purchase/approve |

## ✨ Features
### Admin
- Dashboard: stats overview
- Manage bank managers (add/edit/deactivate)
- View all shares and requests
- Reports

### Bank Manager
- Add/edit shares for their bank
- Review and approve/reject purchase requests
- Reports for their bank

### Investor
- Register & login
- Browse available shares
- Submit purchase requests
- Track request status
- Receive notifications
"# buyshare" 
