const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

// Get all floors (optionally filter by building)
router.get('/', (req, res) => {
  try {
    const { building_id } = req.query;
    
    let query = `
      SELECT f.*, b.name as building_name, b.code as building_code,
        (SELECT COUNT(*) FROM washrooms WHERE floor_id = f.id) as washroom_count
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
    `;
    
    const params = [];
    if (building_id) {
      query += ' WHERE f.building_id = ?';
      params.push(building_id);
    }
    
    query += ' ORDER BY b.name, f.floor_number';
    
    const floors = db.prepare(query).all(...params);
    res.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

// Get floor by ID
router.get('/:id', (req, res) => {
  try {
    const floor = db.prepare(`
      SELECT f.*, b.name as building_name, b.code as building_code
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      WHERE f.id = ?
    `).get(req.params.id);
    
    if (!floor) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    const washrooms = db.prepare(`
      SELECT * FROM washrooms WHERE floor_id = ? ORDER BY name
    `).all(req.params.id);
    
    res.json({ ...floor, washrooms });
  } catch (error) {
    console.error('Error fetching floor:', error);
    res.status(500).json({ error: 'Failed to fetch floor' });
  }
});

// Create floor (admin only)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { building_id, floor_number, floor_name } = req.body;
    
    if (!building_id || floor_number === undefined) {
      return res.status(400).json({ error: 'Building ID and floor number are required' });
    }
    
    const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(building_id);
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    const id = uuidv4();
    const name = floor_name || (floor_number === 0 ? 'Ground Floor' : `Floor ${floor_number}`);
    
    db.prepare(`
      INSERT INTO floors (id, building_id, floor_number, floor_name) VALUES (?, ?, ?, ?)
    `).run(id, building_id, floor_number, name);
    
    const floor = db.prepare(`
      SELECT f.*, b.name as building_name, b.code as building_code
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      WHERE f.id = ?
    `).get(id);
    
    res.status(201).json(floor);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Floor already exists in this building' });
    }
    console.error('Error creating floor:', error);
    res.status(500).json({ error: 'Failed to create floor' });
  }
});

// Update floor (admin only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { floor_number, floor_name } = req.body;
    
    const existing = db.prepare('SELECT * FROM floors WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    db.prepare(`
      UPDATE floors SET floor_number = ?, floor_name = ? WHERE id = ?
    `).run(
      floor_number !== undefined ? floor_number : existing.floor_number,
      floor_name !== undefined ? floor_name : existing.floor_name,
      req.params.id
    );
    
    const floor = db.prepare(`
      SELECT f.*, b.name as building_name, b.code as building_code
      FROM floors f
      JOIN buildings b ON f.building_id = b.id
      WHERE f.id = ?
    `).get(req.params.id);
    
    res.json(floor);
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({ error: 'Failed to update floor' });
  }
});

// Delete floor (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM floors WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    res.json({ message: 'Floor deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ error: 'Failed to delete floor' });
  }
});

module.exports = router;
