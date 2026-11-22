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
      const buildings = await query(`
        SELECT 
          b.*,
          COUNT(DISTINCT f.id) as floor_count,
          COUNT(DISTINCT w.id) as washroom_count
        FROM buildings b
        LEFT JOIN floors f ON b.id = f.building_id
        LEFT JOIN washrooms w ON f.id = w.floor_id
        GROUP BY b.id
        ORDER BY b.name
      `);
      return res.status(200).json(buildings);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Buildings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
