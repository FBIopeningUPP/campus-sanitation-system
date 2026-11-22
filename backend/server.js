require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initDB();
    console.log('✅ Database connected');

    // Routes (loaded after DB init)
    const buildingsRoutes = require('./routes/buildings');
    const floorsRoutes = require('./routes/floors');
    const washroomsRoutes = require('./routes/washrooms');
    const ratingsRoutes = require('./routes/ratings');
    const issuesRoutes = require('./routes/issues');
    const authRoutes = require('./routes/auth');
    const adminRoutes = require('./routes/admin');
    const analyticsRoutes = require('./routes/analytics');

    app.use('/api/buildings', buildingsRoutes);
    app.use('/api/floors', floorsRoutes);
    app.use('/api/washrooms', washroomsRoutes);
    app.use('/api/ratings', ratingsRoutes);
    app.use('/api/issues', issuesRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // Serve frontend for all other routes in production
    if (isProduction) {
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
      });
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
      if (isProduction) {
        console.log(`🌐 Frontend served at http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
