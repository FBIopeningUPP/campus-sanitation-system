const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

// Get all buildings (public)
router.get('/', (req, res) => {
  try {
    const buildings = db.prepare(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM floors WHERE building_id = b.id) as floor_count,
        (SELECT COUNT(*) FROM washrooms w 
         JOIN floors f ON w.floor_id = f.id 
         WHERE f.building_id = b.id) as washroom_count
      FROM buildings b 
      ORDER BY b.name
    `).all();
    
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// Get building by ID (public)
router.get('/:id', (req, res) => {
  try {
    const building = db.prepare(`
      SELECT * FROM buildings WHERE id = ?
    `).get(req.params.id);
    
    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    // Get floors for this building
    const floors = db.prepare(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM washrooms WHERE floor_id = f.id) as washroom_count
      FROM floors f 
      WHERE f.building_id = ? 
      ORDER BY f.floor_number
    `).all(req.params.id);
    
    res.json({ ...building, floors });
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Failed to fetch building' });
  }
});

// Create building (admin only)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO buildings (id, name, code, description) VALUES (?, ?, ?, ?)
    `).run(id, name, code.toUpperCase(), description || null);
    
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id);
    res.status(201).json(building);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Building code already exists' });
    }
    console.error('Error creating building:', error);
    res.status(500).json({ error: 'Failed to create building' });
  }
});

// Update building (admin only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, code, description } = req.body;
    
    const existing = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    db.prepare(`
      UPDATE buildings SET name = ?, code = ?, description = ? WHERE id = ?
    `).run(
      name || existing.name,
      code ? code.toUpperCase() : existing.code,
      description !== undefined ? description : existing.description,
      req.params.id
    );
    
    const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
    res.json(building);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Building code already exists' });
    }
    console.error('Error updating building:', error);
    res.status(500).json({ error: 'Failed to update building' });
  }
});

// Delete building (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM buildings WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    
    res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ error: 'Failed to delete building' });
  }
});

module.exports = router;
