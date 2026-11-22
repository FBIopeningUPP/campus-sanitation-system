import { query, run, initializeDatabase } from './_lib/db.js';
import { sanitizeText, sanitizeUUID, sanitizeInt } from './_lib/sanitize.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function hashIP(ip) {
  const salt = process.env.IP_SALT;
  if (!salt) {
    console.error('WARNING: IP_SALT not set, using fallback');
  }
  return crypto.createHash('sha256').update(ip + (salt || crypto.randomBytes(16).toString('hex'))).digest('hex').substring(0, 16);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      const { washroom_id, limit = 20 } = req.query;
      
      let sql = 'SELECT * FROM ratings';
      const params = [];
      
      if (washroom_id) {
        sql += ' WHERE washroom_id = ?';
        params.push(washroom_id);
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const ratings = await query(sql, params);
      return res.status(200).json(ratings);
    }

    if (req.method === 'POST') {
      const { washroom_id, rating, feedback } = req.body;
      
      // Sanitize inputs
      const cleanWashroomId = sanitizeUUID(washroom_id);
      const cleanRating = sanitizeInt(rating, 1, 5);
      const cleanFeedback = feedback ? sanitizeText(feedback, 500) : null;
      
      if (!cleanWashroomId || !cleanRating) {
        return res.status(400).json({ error: 'Invalid rating data' });
      }

      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
      const ipHash = hashIP(ip);
      const id = uuidv4();

      await run(`
        INSERT INTO ratings (id, washroom_id, rating, feedback, ip_hash)
        VALUES (?, ?, ?, ?, ?)
      `, [id, cleanWashroomId, cleanRating, cleanFeedback, ipHash]);

      // Update washroom average rating
      const stats = await query(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as total
        FROM ratings WHERE washroom_id = ?
      `, [cleanWashroomId]);

      if (stats[0]) {
        await run(`
          UPDATE washrooms 
          SET average_rating = ?, total_ratings = ?
          WHERE id = ?
        `, [stats[0].avg_rating || 0, stats[0].total || 0, cleanWashroomId]);
      }

      return res.status(201).json({ 
        id, 
        message: 'Rating submitted successfully' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Ratings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
