const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

// Get all washrooms with filters
router.get('/', (req, res) => {
  try {
    const { building_id, floor_id, gender, search } = req.query;
    
    let query = `
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.id as building_id, b.name as building_name, b.code as building_code,
        (SELECT COUNT(*) FROM issues WHERE washroom_id = w.id AND status = 'open') as open_issues
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.is_active = 1
    `;
    
    const params = [];
    
    if (building_id) {
      query += ' AND b.id = ?';
      params.push(building_id);
    }
    
    if (floor_id) {
      query += ' AND f.id = ?';
      params.push(floor_id);
    }
    
    if (gender) {
      query += ' AND w.gender = ?';
      params.push(gender);
    }
    
    if (search) {
      query += ' AND (w.name LIKE ? OR b.name LIKE ? OR b.code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY b.name, f.floor_number, w.name';
    
    const washrooms = db.prepare(query).all(...params);
    res.json(washrooms);
  } catch (error) {
    console.error('Error fetching washrooms:', error);
    res.status(500).json({ error: 'Failed to fetch washrooms' });
  }
});

// Get washroom rankings
router.get('/rankings', (req, res) => {
  try {
    const { limit = 10, order = 'desc' } = req.query;
    
    const orderDir = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const washrooms = db.prepare(`
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.is_active = 1 AND w.total_ratings > 0
      ORDER BY w.average_rating ${orderDir}, w.total_ratings DESC
      LIMIT ?
    `).all(parseInt(limit));
    
    res.json(washrooms);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Get washroom by ID
router.get('/:id', (req, res) => {
  try {
    const washroom = db.prepare(`
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.id as building_id, b.name as building_name, b.code as building_code
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.id = ?
    `).get(req.params.id);
    
    if (!washroom) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    const recentRatings = db.prepare(`
      SELECT id, rating, feedback, photo_url, created_at
      FROM ratings
      WHERE washroom_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id);
    
    const openCount = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE washroom_id = ? AND status = 'open'`).get(req.params.id);
    const inProgressCount = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE washroom_id = ? AND status = 'in_progress'`).get(req.params.id);
    const resolvedCount = db.prepare(`SELECT COUNT(*) as c FROM issues WHERE washroom_id = ? AND status = 'resolved'`).get(req.params.id);
    
    const issueStats = {
      open_count: openCount?.c || 0,
      in_progress_count: inProgressCount?.c || 0,
      resolved_count: resolvedCount?.c || 0
    };
    
    res.json({ ...washroom, recentRatings, issueStats });
  } catch (error) {
    console.error('Error fetching washroom:', error);
    res.status(500).json({ error: 'Failed to fetch washroom' });
  }
});

// Get washroom by QR code
router.get('/qr/:qrCode', (req, res) => {
  try {
    const washroom = db.prepare(`
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.id as building_id, b.name as building_name, b.code as building_code
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.qr_code = ?
    `).get(req.params.qrCode);
    
    if (!washroom) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    res.json(washroom);
  } catch (error) {
    console.error('Error fetching washroom by QR:', error);
    res.status(500).json({ error: 'Failed to fetch washroom' });
  }
});

// Create washroom (admin only)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { floor_id, name, gender } = req.body;
    
    if (!floor_id || !name) {
      return res.status(400).json({ error: 'Floor ID and name are required' });
    }
    
    const floor = db.prepare(`
      SELECT f.*, b.code as building_code 
      FROM floors f 
      JOIN buildings b ON f.building_id = b.id 
      WHERE f.id = ?
    `).get(floor_id);
    
    if (!floor) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    const id = uuidv4();
    const genderValue = gender || 'unisex';
    const qrCode = `BU-${floor.building_code}-F${floor.floor_number}-${genderValue.charAt(0).toUpperCase()}-${id.slice(0, 8)}`;
    
    db.prepare(`
      INSERT INTO washrooms (id, floor_id, name, gender, qr_code) VALUES (?, ?, ?, ?, ?)
    `).run(id, floor_id, name, genderValue, qrCode);
    
    const washroom = db.prepare(`
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.id = ?
    `).get(id);
    
    res.status(201).json(washroom);
  } catch (error) {
    console.error('Error creating washroom:', error);
    res.status(500).json({ error: 'Failed to create washroom' });
  }
});

// Update washroom (admin only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, gender, is_active } = req.body;
    
    const existing = db.prepare('SELECT * FROM washrooms WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    db.prepare(`
      UPDATE washrooms SET name = ?, gender = ?, is_active = ? WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      gender !== undefined ? gender : existing.gender,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      req.params.id
    );
    
    const washroom = db.prepare(`
      SELECT w.*, 
        f.floor_number, f.floor_name,
        b.name as building_name, b.code as building_code
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.id = ?
    `).get(req.params.id);
    
    res.json(washroom);
  } catch (error) {
    console.error('Error updating washroom:', error);
    res.status(500).json({ error: 'Failed to update washroom' });
  }
});

// Delete washroom (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM washrooms WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Washroom not found' });
    }
    
    res.json({ message: 'Washroom deleted successfully' });
  } catch (error) {
    console.error('Error deleting washroom:', error);
    res.status(500).json({ error: 'Failed to delete washroom' });
  }
});

module.exports = router;
