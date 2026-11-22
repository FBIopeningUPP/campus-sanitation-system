const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { checkRatingLimit, recordAction } = require('../middleware/rateLimit');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rating-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'));
  }
});

// Get ratings for a washroom
router.get('/washroom/:washroomId', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const ratings = db.prepare(`
      SELECT id, rating, feedback, photo_url, created_at
      FROM ratings
      WHERE washroom_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.washroomId, parseInt(limit), parseInt(offset));
    
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM ratings WHERE washroom_id = ?
    `).get(req.params.washroomId);
    
    res.json({ ratings, total: total?.count || 0 });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get rating distribution for a washroom
router.get('/distribution/:washroomId', (req, res) => {
  try {
    const distribution = db.prepare(`
      SELECT rating, COUNT(*) as count
      FROM ratings
      WHERE washroom_id = ?
      GROUP BY rating
      ORDER BY rating
    `).all(req.params.washroomId);
    
    const result = [1, 2, 3, 4, 5].map(r => {
      const found = distribution.find(d => d.rating === r);
      return { rating: r, count: found ? found.count : 0 };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// Submit a rating (with rate limiting)
router.post('/', checkRatingLimit, upload.single('photo'), (req, res) => {
  try {
    const { washroom_id, rating, feedback } = req.body;
    
    if (!washroom_id || !rating) {
      return res.status(400).json({ error: 'Washroom ID and rating are required' });
    }
    
    const ratingValue = parseInt(rating);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const washroom = db.prepare('SELECT id FROM washrooms WHERE id = ?').get(washroom_id);
    if (!washroom) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    const id = uuidv4();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.prepare(`
      INSERT INTO ratings (id, washroom_id, rating, feedback, photo_url, ip_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, washroom_id, ratingValue, feedback || null, photoUrl, req.ipHash);
    
    // Update washroom average rating
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total
      FROM ratings WHERE washroom_id = ?
    `).get(washroom_id);
    
    db.prepare(`
      UPDATE washrooms SET average_rating = ?, total_ratings = ? WHERE id = ?
    `).run(Math.round((stats?.avg_rating || 0) * 100) / 100, stats?.total || 0, washroom_id);
    
    recordAction(req.ipHash, 'rating');
    
    res.status(201).json({
      id,
      message: 'Rating submitted successfully',
      averageRating: Math.round((stats?.avg_rating || 0) * 100) / 100,
      totalRatings: stats?.total || 0
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
