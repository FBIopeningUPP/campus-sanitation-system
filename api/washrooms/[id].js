import { query, initializeDatabase } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    await initializeDatabase();

    if (req.method === 'GET') {
      const washrooms = await query(`
        SELECT 
          w.*,
          f.floor_number,
          f.name as floor_name,
          b.id as building_id,
          b.name as building_name,
          b.code as building_code
        FROM washrooms w
        JOIN floors f ON w.floor_id = f.id
        JOIN buildings b ON f.building_id = b.id
        WHERE w.id = ?
      `, [id]);

      if (washrooms.length === 0) {
        return res.status(404).json({ error: 'Washroom not found' });
      }

      const washroom = washrooms[0];

      // Get recent ratings
      const recentRatings = await query(`
        SELECT * FROM ratings 
        WHERE washroom_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [id]);

      // Get open issues count
      const issueCount = await query(`
        SELECT COUNT(*) as count FROM issues 
        WHERE washroom_id = ? AND status != 'resolved'
      `, [id]);

      return res.status(200).json({
        ...washroom,
        recentRatings,
        openIssues: issueCount[0]?.count || 0
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Washroom detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
