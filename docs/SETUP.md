# Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should show v18.x.x or higher
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

## Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd /home/milind/campus-sanitation-system/backend

# Install dependencies
npm install

# Initialize the database (creates tables and admin user)
npm run init-db

# Seed with sample Bennett University data
npm run seed

# Start the development server
npm run dev
```

The backend will run at `http://localhost:3000`

### 2. Frontend Setup

```bash
# Open a new terminal
cd /home/milind/campus-sanitation-system/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173`

### 3. Access the Application

- **Student Interface:** http://localhost:5173
- **Admin Login:** http://localhost:5173/admin/login
- **API Health Check:** http://localhost:3000/api/health

### 4. Default Credentials

**Admin Account:**
- Email: `admin@bennett.edu.in`
- Password: `admin123`

## Configuration

### Backend Environment Variables

Edit `/backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secure-secret-key

# Admin Credentials
ADMIN_EMAIL=admin@bennett.edu.in
ADMIN_PASSWORD=admin123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window
RATING_LIMIT_PER_DAY=5         # Max ratings per IP per day

# Uploads
MAX_FILE_SIZE=5242880          # 5MB
```

### Frontend Environment Variables

Edit `/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'better-sqlite3'"**
   ```bash
   cd backend
   npm install better-sqlite3 --build-from-source
   ```

2. **Port already in use**
   - Change PORT in backend `.env`
   - Or kill the process using the port:
     ```bash
     lsof -ti:3000 | xargs kill
     ```

3. **Database locked**
   - Stop all backend processes
   - Delete `/database/sanitation.db`
   - Re-run `npm run init-db && npm run seed`

4. **CORS errors**
   - Ensure backend is running
   - Check `VITE_API_URL` in frontend `.env`

## Database Management

### Reset Database

```bash
cd backend
rm ../database/sanitation.db
npm run init-db
npm run seed
```

### View Database

You can use any SQLite viewer:
- DB Browser for SQLite
- SQLite CLI: `sqlite3 ../database/sanitation.db`

### Backup Database

```bash
cp database/sanitation.db database/sanitation-backup.db
```
