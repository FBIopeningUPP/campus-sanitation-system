const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { checkIssueLimit, recordAction } = require('../middleware/rateLimit');
const authMiddleware = require('../middleware/auth');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
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

const ISSUE_TYPES = ['dirty_toilet', 'missing_soap', 'water_shortage', 'broken_fixture', 'bad_odor', 'no_water', 'electrical', 'other'];

// Get all issues (public)
router.get('/', (req, res) => {
  try {
    const { washroom_id, building_id, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT i.*, 
        w.name as washroom_name, w.gender,
        f.floor_number, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (washroom_id) {
      query += ' AND i.washroom_id = ?';
      params.push(washroom_id);
    }
    
    if (building_id) {
      query += ' AND b.id = ?';
      params.push(building_id);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const issues = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE 1=1
    `;
    
    const countParams = [];
    if (washroom_id) { countQuery += ' AND i.washroom_id = ?'; countParams.push(washroom_id); }
    if (building_id) { countQuery += ' AND b.id = ?'; countParams.push(building_id); }
    if (status) { countQuery += ' AND i.status = ?'; countParams.push(status); }
    
    const total = db.prepare(countQuery).get(...countParams);
    
    res.json({ issues, total: total?.count || 0 });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get issue by ID
router.get('/:id', (req, res) => {
  try {
    const issue = db.prepare(`
      SELECT i.*, 
        w.name as washroom_name, w.gender,
        f.floor_number, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// Report a new issue (with rate limiting)
router.post('/', checkIssueLimit, upload.single('photo'), (req, res) => {
  try {
    const { washroom_id, issue_type, description, priority } = req.body;
    
    if (!washroom_id || !issue_type) {
      return res.status(400).json({ error: 'Washroom ID and issue type are required' });
    }
    
    if (!ISSUE_TYPES.includes(issue_type)) {
      return res.status(400).json({ error: 'Invalid issue type', validTypes: ISSUE_TYPES });
    }
    
    const washroom = db.prepare('SELECT id FROM washrooms WHERE id = ?').get(washroom_id);
    if (!washroom) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    const id = uuidv4();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const priorityValue = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
    
    db.prepare(`
      INSERT INTO issues (id, washroom_id, issue_type, description, photo_url, priority, ip_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, washroom_id, issue_type, description || null, photoUrl, priorityValue, req.ipHash);
    
    recordAction(req.ipHash, 'issue');
    
    const issue = db.prepare(`
      SELECT i.*, w.name as washroom_name, b.name as building_name
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE i.id = ?
    `).get(id);
    
    res.status(201).json({ issue, message: 'Issue reported successfully' });
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// Update issue status (admin only)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const resolvedAt = status === 'resolved' ? "datetime('now')" : null;
    
    if (status === 'resolved') {
      db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now'), resolved_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
    } else {
      db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now'), resolved_at = NULL WHERE id = ?`).run(status, req.params.id);
    }
    
    const issue = db.prepare(`
      SELECT i.*, w.name as washroom_name, b.name as building_name
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    res.json(issue);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Update issue priority (admin only)
router.put('/:id/priority', authMiddleware, (req, res) => {
  try {
    const { priority } = req.body;
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    const existing = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    db.prepare(`UPDATE issues SET priority = ?, updated_at = datetime('now') WHERE id = ?`).run(priority, req.params.id);
    
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    res.json(issue);
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

// Delete issue (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
