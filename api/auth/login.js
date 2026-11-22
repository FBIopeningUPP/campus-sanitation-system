import { query, run, initializeDatabase } from '../_lib/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-sanitation-secret-key';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if admin exists, if not create default admin
    let admins = await query('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (admins.length === 0 && email === 'admin@bennett.edu.in') {
      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminId = uuidv4();
      await run(
        'INSERT INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
        [adminId, 'admin@bennett.edu.in', hashedPassword, 'Admin']
      );
      admins = await query('SELECT * FROM admins WHERE email = ?', [email]);
    }

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
