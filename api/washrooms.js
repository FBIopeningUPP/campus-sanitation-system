import { query, initializeDatabase } from './_lib/db.js';

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
      const { building_id, gender, limit = 50, offset = 0 } = req.query;
      
      let sql = `
        SELECT 
          w.*,
          f.floor_number,
          f.name as floor_name,
          b.id as building_id,
          b.name as building_name,
          b.code as building_code,
          (SELECT COUNT(*) FROM issues i WHERE i.washroom_id = w.id AND i.status = 'open') as open_issues
        FROM washrooms w
        JOIN floors f ON w.floor_id = f.id
        JOIN buildings b ON f.building_id = b.id
        WHERE w.is_active = 1
      `;
      
      const params = [];
      
      if (building_id) {
        sql += ` AND b.id = ?`;
        params.push(building_id);
      }
      
      if (gender) {
        sql += ` AND w.gender = ?`;
        params.push(gender);
      }
      
      sql += ` ORDER BY b.name, f.floor_number, w.name LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
      
      const washrooms = await query(sql, params);
      return res.status(200).json(washrooms);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Washrooms API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
