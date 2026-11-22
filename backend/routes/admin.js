const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    const buildings = db.prepare('SELECT COUNT(*) as count FROM buildings').get();
    const washrooms = db.prepare('SELECT COUNT(*) as count FROM washrooms').get();
    const ratings = db.prepare('SELECT COUNT(*) as count FROM ratings').get();
    
    const totalIssues = db.prepare('SELECT COUNT(*) as c FROM issues').get();
    const openIssues = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE status = 'open'`).get();
    const inProgressIssues = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE status = 'in_progress'`).get();
    const resolvedIssues = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE status = 'resolved'`).get();
    
    const avgRating = db.prepare(`SELECT AVG(average_rating) as avg FROM washrooms WHERE total_ratings > 0`).get();
    
    const recentIssues = db.prepare(`
      SELECT i.*, w.name as washroom_name, b.name as building_name
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all();
    
    const topWashrooms = db.prepare(`
      SELECT w.*, b.name as building_name
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.total_ratings > 0
      ORDER BY w.average_rating DESC
      LIMIT 5
    `).all();
    
    const lowestWashrooms = db.prepare(`
      SELECT w.*, b.name as building_name
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.total_ratings > 0
      ORDER BY w.average_rating ASC
      LIMIT 5
    `).all();
    
    res.json({
      summary: {
        totalBuildings: buildings?.count || 0,
        totalWashrooms: washrooms?.count || 0,
        totalRatings: ratings?.count || 0,
        totalIssues: totalIssues?.c || 0,
        openIssues: openIssues?.c || 0,
        inProgressIssues: inProgressIssues?.c || 0,
        resolvedIssues: resolvedIssues?.c || 0,
        averageRating: avgRating?.avg ? Math.round(avgRating.avg * 100) / 100 : 0
      },
      recentIssues,
      topWashrooms,
      lowestWashrooms
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Export ratings to CSV
router.get('/export/ratings', (req, res) => {
  try {
    const { building_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT r.id, r.rating, r.feedback, r.created_at,
        w.name as washroom_name, w.gender,
        f.floor_name, b.name as building_name, b.code as building_code
      FROM ratings r
      JOIN washrooms w ON r.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    if (start_date) { query += ' AND r.created_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND r.created_at <= ?'; params.push(end_date); }
    query += ' ORDER BY r.created_at DESC';
    
    const ratings = db.prepare(query).all(...params);
    
    const headers = ['ID', 'Rating', 'Feedback', 'Date', 'Washroom', 'Gender', 'Floor', 'Building', 'Building Code'];
    const csvRows = [headers.join(',')];
    
    for (const r of ratings) {
      const row = [
        r.id,
        r.rating,
        `"${(r.feedback || '').replace(/"/g, '""')}"`,
        r.created_at,
        `"${r.washroom_name}"`,
        r.gender,
        `"${r.floor_name}"`,
        `"${r.building_name}"`,
        r.building_code
      ];
      csvRows.push(row.join(','));
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ratings-export.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting ratings:', error);
    res.status(500).json({ error: 'Failed to export ratings' });
  }
});

// Export issues to CSV
router.get('/export/issues', (req, res) => {
  try {
    const { building_id, status, start_date, end_date } = req.query;
    
    let query = `
      SELECT i.id, i.issue_type, i.description, i.status, i.priority,
        i.created_at, i.resolved_at,
        w.name as washroom_name, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    if (building_id) { query += ' AND b.id = ?'; params.push(building_id); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    if (start_date) { query += ' AND i.created_at >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND i.created_at <= ?'; params.push(end_date); }
    query += ' ORDER BY i.created_at DESC';
    
    const issues = db.prepare(query).all(...params);
    
    const headers = ['ID', 'Issue Type', 'Description', 'Status', 'Priority', 'Created', 'Resolved', 'Washroom', 'Floor', 'Building', 'Building Code'];
    const csvRows = [headers.join(',')];
    
    for (const i of issues) {
      const row = [
        i.id,
        i.issue_type,
        `"${(i.description || '').replace(/"/g, '""')}"`,
        i.status,
        i.priority,
        i.created_at,
        i.resolved_at || '',
        `"${i.washroom_name}"`,
        `"${i.floor_name}"`,
        `"${i.building_name}"`,
        i.building_code
      ];
      csvRows.push(row.join(','));
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=issues-export.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting issues:', error);
    res.status(500).json({ error: 'Failed to export issues' });
  }
});

module.exports = router;
