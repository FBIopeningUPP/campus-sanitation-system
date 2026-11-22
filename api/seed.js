import { query, run, initializeDatabase } from './_lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect seed endpoint with secret key
  const seedKey = req.headers['x-seed-key'] || req.query.key;
  const expectedKey = process.env.SEED_KEY;
  
  if (expectedKey && seedKey !== expectedKey) {
    return res.status(403).json({ error: 'Unauthorized - seed key required' });
  }

  try {
    await initializeDatabase();

    // Get existing building codes
    const existingBuildings = await query('SELECT code FROM buildings');
    const existingCodes = new Set(existingBuildings.map(b => b.code));

    // Seed buildings - Bennett University Campus
    const buildings = [
      // Academic Blocks
      { name: 'A Block', code: 'A', description: 'Academic' },
      { name: 'B Block', code: 'B', description: 'Academic' },
      { name: 'K Block', code: 'K', description: 'Academic' },
      
      // C Block Hostels
      { name: 'C1', code: 'C1', description: 'Hostel' },
      { name: 'C2', code: 'C2', description: 'Hostel' },
      { name: 'C3', code: 'C3', description: 'Hostel' },
      { name: 'C4', code: 'C4', description: 'Hostel' },
      { name: 'C5', code: 'C5', description: 'Hostel' },
      { name: 'C6', code: 'C6', description: 'Hostel' },
      { name: 'C7', code: 'C7', description: 'Hostel' },
      { name: 'C8', code: 'C8', description: 'Hostel' },
      { name: 'C9', code: 'C9', description: 'Hostel' },
      { name: 'C10', code: 'C10', description: 'Hostel' },
      { name: 'C11', code: 'C11', description: 'Hostel' },
      { name: 'C12', code: 'C12', description: 'Hostel' },
      
      // D Block Hostels
      { name: 'D1', code: 'D1', description: 'Hostel' },
      { name: 'D2', code: 'D2', description: 'Hostel' },
      { name: 'D3', code: 'D3', description: 'Hostel' },
      { name: 'D4', code: 'D4', description: 'Hostel' },
      { name: 'D5', code: 'D5', description: 'Hostel' },
      { name: 'D6', code: 'D6', description: 'Hostel' },
      
      // E Block Hostel
      { name: 'E1', code: 'E1', description: 'Hostel' },
      
      // Academic Blocks
      { name: 'M Block', code: 'M', description: 'Academic' },
      { name: 'N Block', code: 'N', description: 'Academic' },
      { name: 'P Block', code: 'P', description: 'Academic' },
      
      // Food
      { name: 'Mess', code: 'MESS', description: 'Mess' },
      { name: 'Paid Mess', code: 'PM', description: 'Paid Mess' },
      { name: 'Melting Point', code: 'MP', description: 'Food Court' },
    ];

    let addedCount = 0;
    for (const building of buildings) {
      // Skip if building already exists
      if (existingCodes.has(building.code)) continue;
      
      addedCount++;
      const buildingId = uuidv4();
      await run(
        'INSERT INTO buildings (id, name, code, description) VALUES (?, ?, ?, ?)',
        [buildingId, building.name, building.code, building.description]
      );

      // Determine floors based on building type
      const isHostel = building.description === 'Hostel';
      const isFood = ['Mess', 'Paid Mess', 'Food Court'].includes(building.description);
      const maxFloor = isFood ? 0 : (isHostel ? 3 : 2);

      for (let floorNum = 0; floorNum <= maxFloor; floorNum++) {
        const floorId = uuidv4();
        const floorName = floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`;
        
        await run(
          'INSERT INTO floors (id, building_id, floor_number, name) VALUES (?, ?, ?, ?)',
          [floorId, buildingId, floorNum, floorName]
        );

        // Add washrooms - simpler naming
        const genders = isHostel ? ['unisex'] : ['male', 'female'];
        for (const gender of genders) {
          const washroomId = uuidv4();
          const genderLabel = gender === 'unisex' ? '' : (gender === 'male' ? 'Male ' : 'Female ');
          const washroomName = `${building.name} ${floorName} ${genderLabel}Washroom`.trim();
          const qrCode = `BU-${building.code}-F${floorNum}-${washroomId.substring(0, 8)}`;

          await run(
            'INSERT INTO washrooms (id, floor_id, name, gender, qr_code, average_rating, total_ratings) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [washroomId, floorId, washroomName, gender, qrCode, 0, 0]
          );
        }
      }
    }

    // Create admin from environment variables (secure)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword) {
      const adminId = uuidv4();
      const hashedPassword = await bcrypt.hash(adminPassword, 12); // Higher cost factor
      await run(
        'INSERT OR IGNORE INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
        [adminId, adminEmail, hashedPassword, 'Administrator']
      );
    } else {
      console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set - no admin created');
    }

    const finalCount = await query('SELECT COUNT(*) as count FROM buildings');
    const washroomCount = await query('SELECT COUNT(*) as count FROM washrooms');

    return res.status(200).json({ 
      message: addedCount > 0 ? `Added ${addedCount} new buildings` : 'All buildings already exist',
      totalBuildings: finalCount[0]?.count || 0,
      totalWashrooms: washroomCount[0]?.count || 0
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed failed: ' + error.message });
  }
}
