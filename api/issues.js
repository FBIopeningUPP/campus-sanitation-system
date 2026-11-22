import { query, run, initializeDatabase } from './_lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'salt')).digest('hex').substring(0, 16);
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
      const { status, washroom_id, limit = 50 } = req.query;
      
      let sql = `
        SELECT 
          i.*,
          w.name as washroom_name,
          b.name as building_name
        FROM issues i
        JOIN washrooms w ON i.washroom_id = w.id
        JOIN floors f ON w.floor_id = f.id
        JOIN buildings b ON f.building_id = b.id
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        sql += ' AND i.status = ?';
        params.push(status);
      }
      
      if (washroom_id) {
        sql += ' AND i.washroom_id = ?';
        params.push(washroom_id);
      }
      
      sql += ' ORDER BY i.created_at DESC LIMIT ?';
      params.push(parseInt(limit));
      
      const issues = await query(sql, params);
      return res.status(200).json(issues);
    }

    if (req.method === 'POST') {
      const { washroom_id, issue_type, description, priority = 'medium' } = req.body;
      
      if (!washroom_id || !issue_type) {
        return res.status(400).json({ error: 'Washroom ID and issue type are required' });
      }

      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
      const ipHash = hashIP(ip);
      const id = uuidv4();

      await run(`
        INSERT INTO issues (id, washroom_id, issue_type, description, priority, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, washroom_id, issue_type, description || null, priority, ipHash]);

      // Get the created issue with details
      const issues = await query(`
        SELECT 
          i.*,
          w.name as washroom_name,
          b.name as building_name
        FROM issues i
        JOIN washrooms w ON i.washroom_id = w.id
        JOIN floors f ON w.floor_id = f.id
        JOIN buildings b ON f.building_id = b.id
        WHERE i.id = ?
      `, [id]);

      return res.status(201).json({ 
        issue: issues[0],
        message: 'Issue reported successfully' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Issues API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
