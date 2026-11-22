# 🚿 Campus Sanitation Rating System

A modern, mobile-first web application for Bennett University to rate and track campus washroom cleanliness, supporting **SDG 6: Clean Water and Sanitation**.

![SDG 6](https://img.shields.io/badge/SDG%206-Clean%20Water%20%26%20Sanitation-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57)

## ✨ Features

### Student Features (No Login Required)
- 🔍 Browse washroom directory with building/floor filters
- ⭐ Rate washrooms (1-5 stars) anonymously
- 🚨 Report issues with optional photos
- 📊 View washroom rankings
- 📱 Track issue status publicly
- 📷 QR code scanning for quick access

### Admin Features (Secure Login)
- 📈 Dashboard with key metrics
- 🏢 Manage buildings, floors, and washrooms
- 🎫 View and manage complaints
- 🔄 Update issue status (Open → In Progress → Resolved)
- 📊 Analytics with charts and trends
- 📥 Export data to CSV
- 🖨️ Generate printable QR codes

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Authentication:** JWT-based admin authentication
- **Rate Limiting:** IP-based spam prevention

## 📁 Project Structure

```
campus-sanitation-system/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── context/    # React context (Auth)
│   └── ...
├── backend/            # Express API server
│   ├── routes/         # API routes
│   ├── middleware/     # Auth & rate limiting
│   ├── database/       # Database connection
│   └── scripts/        # DB initialization
├── database/           # SQLite database file
├── uploads/            # Uploaded photos
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone/Navigate to project:**
   ```bash
   cd /home/milind/campus-sanitation-system
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize database:**
   ```bash
   npm run init-db
   npm run seed
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   ```

5. **In a new terminal, install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

6. **Start frontend development server:**
   ```bash
   npm run dev
   ```

7. **Access the application:**
   - Student Site: http://localhost:5173
   - Admin Panel: http://localhost:5173/admin/login
   - API: http://localhost:3000/api

### Default Admin Credentials
- **Email:** admin@bennett.edu.in
- **Password:** admin123

## 📖 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/buildings | List all buildings |
| GET | /api/washrooms | List washrooms (with filters) |
| GET | /api/washrooms/rankings | Get washroom rankings |
| GET | /api/issues | List public issues |
| POST | /api/ratings | Submit a rating |
| POST | /api/issues | Report an issue |

### Admin Endpoints (Authentication Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/admin/dashboard | Dashboard data |
| GET | /api/analytics/* | Analytics data |
| GET | /api/admin/export/* | Export to CSV |
| POST/PUT/DELETE | /api/buildings/* | Manage buildings |
| POST/PUT/DELETE | /api/floors/* | Manage floors |
| POST/PUT/DELETE | /api/washrooms/* | Manage washrooms |
| PUT | /api/issues/:id/status | Update issue status |

## 🔒 Security Features

- **Rate Limiting:** 5 ratings per IP per day, 10 issues per IP per day
- **IP Hashing:** Privacy-friendly IP tracking for rate limiting
- **JWT Authentication:** Secure admin sessions (24h expiry)
- **File Validation:** Image uploads limited to 5MB, JPG/PNG only
- **Input Sanitization:** Protection against XSS and SQL injection

## 📊 Database Schema

### Tables
- **buildings** - Campus buildings
- **floors** - Building floors
- **washrooms** - Individual washrooms
- **ratings** - User ratings (anonymous)
- **issues** - Reported issues
- **admin_users** - Admin accounts
- **rate_limits** - Rate limiting records

## 🎨 UI/UX Design

- **Mobile-First:** Optimized for smartphone usage
- **University Theme:** Professional blue (#1e40af) color scheme
- **Accessible:** WCAG compliant contrast ratios
- **Responsive:** Works on all screen sizes
- **Touch-Friendly:** 44px minimum touch targets

## 📱 QR Code System

Each washroom has a unique QR code that links directly to its rating page:
- Format: `BU-{BUILDING}-F{FLOOR}-{GENDER}-{ID}`
- Example: `BU-AB1-F2-M-a1b2c3d4`

Generate and print QR codes from the admin panel.

## 🚀 Deployment

### For Production

1. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with your preferred method:**
   - Static hosting (Vercel, Netlify)
   - Node.js server serving static files
   - Azure Static Web Apps

3. **Configure environment variables:**
   - Update `VITE_API_URL` for production API
   - Set secure `JWT_SECRET` in backend

### Azure Deployment (Future)
See `docs/DEPLOYMENT.md` for Azure-specific instructions.

## 📝 License

MIT License - Built for Bennett University

## 🙏 Acknowledgments

- Bennett University for the initiative
- SDG 6: Clean Water and Sanitation
- Open source community

---

**Made with ❤️ for a cleaner campus**
