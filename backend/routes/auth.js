const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Admin login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const validPassword = bcrypt.compareSync(password, admin.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    db.prepare('UPDATE admin_users SET last_login = datetime("now") WHERE id = ?').run(admin.id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = db.prepare('SELECT id, email, full_name, role FROM admin_users WHERE id = ?').get(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ valid: false });
    }
    
    res.json({ 
      valid: true, 
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
