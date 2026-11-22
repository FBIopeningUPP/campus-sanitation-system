const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get ratings trend over time
router.get('/ratings-trend', (req, res) => {
  try {
    const { days = 30, building_id } = req.query;
    
    let query = `
      SELECT DATE(r.created_at) as date,
        COUNT(*) as count,
        AVG(r.rating) as avg_rating
      FROM ratings r
      JOIN washrooms w ON r.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE r.created_at >= date('now', '-${parseInt(days)} days')
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    query += ' GROUP BY DATE(r.created_at) ORDER BY date';
    
    const trend = db.prepare(query).all(...params);
    res.json(trend);
  } catch (error) {
    console.error('Error fetching ratings trend:', error);
    res.status(500).json({ error: 'Failed to fetch ratings trend' });
  }
});

// Get issues trend over time
router.get('/issues-trend', (req, res) => {
  try {
    const { days = 30, building_id } = req.query;
    
    let query = `
      SELECT DATE(i.created_at) as date,
        COUNT(*) as reported,
        SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE i.created_at >= date('now', '-${parseInt(days)} days')
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    query += ' GROUP BY DATE(i.created_at) ORDER BY date';
    
    const trend = db.prepare(query).all(...params);
    res.json(trend);
  } catch (error) {
    console.error('Error fetching issues trend:', error);
    res.status(500).json({ error: 'Failed to fetch issues trend' });
  }
});

// Get issue type distribution
router.get('/issue-types', (req, res) => {
  try {
    const { building_id } = req.query;
    
    let query = `
      SELECT i.issue_type, COUNT(*) as count
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    query += ' GROUP BY i.issue_type ORDER BY count DESC';
    
    const distribution = db.prepare(query).all(...params);
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching issue types:', error);
    res.status(500).json({ error: 'Failed to fetch issue types' });
  }
});

// Get building-wise statistics
router.get('/building-stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT b.id, b.name, b.code,
        COUNT(DISTINCT w.id) as washroom_count,
        COALESCE(AVG(w.average_rating), 0) as avg_rating,
        COALESCE(SUM(w.total_ratings), 0) as total_ratings,
        (SELECT COUNT(*) FROM issues i2 
         JOIN washrooms w2 ON i2.washroom_id = w2.id 
         JOIN floors f2 ON w2.floor_id = f2.id 
         WHERE f2.building_id = b.id AND i2.status = 'open') as open_issues
      FROM buildings b
      LEFT JOIN floors f ON f.building_id = b.id
      LEFT JOIN washrooms w ON w.floor_id = f.id
      GROUP BY b.id
      ORDER BY b.name
    `).all();
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching building stats:', error);
    res.status(500).json({ error: 'Failed to fetch building stats' });
  }
});

// Get rating distribution (all washrooms)
router.get('/rating-distribution', (req, res) => {
  try {
    const { building_id } = req.query;
    
    let query = `
      SELECT r.rating, COUNT(*) as count
      FROM ratings r
      JOIN washrooms w ON r.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    query += ' GROUP BY r.rating ORDER BY r.rating';
    
    const distribution = db.prepare(query).all(...params);
    
    const result = [1, 2, 3, 4, 5].map(r => {
      const found = distribution.find(d => d.rating === r);
      return { rating: r, count: found ? found.count : 0 };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching rating distribution:', error);
    res.status(500).json({ error: 'Failed to fetch rating distribution' });
  }
});

// Get response time metrics
router.get('/response-time', (req, res) => {
  try {
    const avgTime = db.prepare(`
      SELECT AVG(julianday(resolved_at) - julianday(created_at)) * 24 as avg_hours
      FROM issues 
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `).get();
    
    const byType = db.prepare(`
      SELECT issue_type,
        AVG(julianday(resolved_at) - julianday(created_at)) * 24 as avg_hours,
        COUNT(*) as resolved_count
      FROM issues 
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
      GROUP BY issue_type
    `).all();
    
    res.json({
      averageResponseHours: avgTime?.avg_hours ? Math.round(avgTime.avg_hours * 10) / 10 : 0,
      byIssueType: byType
    });
  } catch (error) {
    console.error('Error fetching response time:', error);
    res.status(500).json({ error: 'Failed to fetch response time' });
  }
});

module.exports = router;
