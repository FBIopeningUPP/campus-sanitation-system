import { query, run, initializeDatabase } from '../_lib/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect with secret key
  const resetKey = req.headers['x-reset-key'] || req.query.key;
  const expectedKey = process.env.SEED_KEY;
  
  if (!expectedKey || resetKey !== expectedKey) {
    return res.status(403).json({ error: 'Unauthorized - reset key required' });
  }

  try {
    await initializeDatabase();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ error: 'Admin credentials not configured in environment' });
    }

    // Delete old admin(s)
    await run('DELETE FROM admins');
    
    // Create new admin with secure credentials
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await run(
      'INSERT INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [adminId, adminEmail, hashedPassword, 'Administrator']
    );

    return res.status(200).json({ 
      message: 'Admin reset successfully',
      email: adminEmail
    });
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: 'Reset failed: ' + error.message });
  }
}
