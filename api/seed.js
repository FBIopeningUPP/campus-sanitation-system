import { query, run, initializeDatabase } from './_lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    // Check if already seeded
    const existingBuildings = await query('SELECT COUNT(*) as count FROM buildings');
    if (existingBuildings[0]?.count > 0) {
      return res.status(200).json({ 
        message: 'Database already seeded',
        buildings: existingBuildings[0].count
      });
    }

    // Seed buildings
    const buildings = [
      { name: 'Academic Block 1', code: 'AB1', description: 'Main academic building' },
      { name: 'Academic Block 2', code: 'AB2', description: 'Science and labs' },
      { name: 'Academic Block 3', code: 'AB3', description: 'Engineering block' },
      { name: 'Library', code: 'LIB', description: 'Central library' },
      { name: 'Student Center', code: 'SC', description: 'Student activities' },
      { name: 'Boys Hostel 1', code: 'BH1', description: 'Boys accommodation' },
      { name: 'Girls Hostel 1', code: 'GH1', description: 'Girls accommodation' },
      { name: 'Cafeteria', code: 'CAF', description: 'Main cafeteria' },
      { name: 'Sports Complex', code: 'SPT', description: 'Sports facilities' },
      { name: 'Admin Block', code: 'ADM', description: 'Administration' },
    ];

    for (const building of buildings) {
      const buildingId = uuidv4();
      await run(
        'INSERT INTO buildings (id, name, code, description) VALUES (?, ?, ?, ?)',
        [buildingId, building.name, building.code, building.description]
      );

      // Add floors (0-5 for each building)
      for (let floorNum = 0; floorNum <= 5; floorNum++) {
        const floorId = uuidv4();
        const floorName = floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`;
        
        await run(
          'INSERT INTO floors (id, building_id, floor_number, name) VALUES (?, ?, ?, ?)',
          [floorId, buildingId, floorNum, floorName]
        );

        // Add washrooms (male and female on each floor)
        if (floorNum <= 3) { // Only first 4 floors
          for (const gender of ['male', 'female']) {
            const washroomId = uuidv4();
            const washroomName = `${building.code} ${floorName} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Washroom`;
            const qrCode = `BU-${building.code}-F${floorNum}-${gender[0].toUpperCase()}-${washroomId.substring(0, 8)}`;

            await run(
              'INSERT INTO washrooms (id, floor_id, name, gender, qr_code, average_rating, total_ratings) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [washroomId, floorId, washroomName, gender, qrCode, Math.random() * 2 + 3, Math.floor(Math.random() * 20)]
            );
          }
        }
      }
    }

    // Create default admin
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await run(
      'INSERT OR IGNORE INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
      [adminId, 'admin@bennett.edu.in', hashedPassword, 'Administrator']
    );

    const finalCount = await query('SELECT COUNT(*) as count FROM buildings');
    const washroomCount = await query('SELECT COUNT(*) as count FROM washrooms');

    return res.status(200).json({ 
      message: 'Database seeded successfully',
      buildings: finalCount[0]?.count || 0,
      washrooms: washroomCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
}
