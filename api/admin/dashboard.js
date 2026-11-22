import { query, initializeDatabase } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    // Get summary stats
    const buildingCount = await query('SELECT COUNT(*) as count FROM buildings');
    const washroomCount = await query('SELECT COUNT(*) as count FROM washrooms WHERE is_active = 1');
    const ratingCount = await query('SELECT COUNT(*) as count FROM ratings');
    const avgRating = await query('SELECT AVG(rating) as avg FROM ratings');
    
    const openIssues = await query("SELECT COUNT(*) as count FROM issues WHERE status = 'open'");
    const inProgressIssues = await query("SELECT COUNT(*) as count FROM issues WHERE status = 'in_progress'");
    const resolvedIssues = await query("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'");
    const totalIssues = await query('SELECT COUNT(*) as count FROM issues');

    // Recent issues
    const recentIssues = await query(`
      SELECT 
        i.*,
        w.name as washroom_name,
        b.name as building_name
      FROM issues i
      JOIN washrooms w ON i.washroom_id = w.id
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

    // Low rated washrooms
    const lowRatedWashrooms = await query(`
      SELECT 
        w.*,
        b.name as building_name,
        f.name as floor_name
      FROM washrooms w
      JOIN floors f ON w.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE w.total_ratings > 0
      ORDER BY w.average_rating ASC
      LIMIT 5
    `);

    return res.status(200).json({
      summary: {
        totalBuildings: buildingCount[0]?.count || 0,
        totalWashrooms: washroomCount[0]?.count || 0,
        totalRatings: ratingCount[0]?.count || 0,
        averageRating: avgRating[0]?.avg ? parseFloat(avgRating[0].avg).toFixed(1) : '0.0',
        openIssues: openIssues[0]?.count || 0,
        inProgressIssues: inProgressIssues[0]?.count || 0,
        resolvedIssues: resolvedIssues[0]?.count || 0,
        totalIssues: totalIssues[0]?.count || 0
      },
      recentIssues,
      lowRatedWashrooms
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
