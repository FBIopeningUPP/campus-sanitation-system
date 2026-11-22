const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../../database/sanitation.db');

async function seedDatabase() {
  console.log('🌱 Seeding database with Bennett University data...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  // Bennett University Buildings
  const buildings = [
    { id: uuidv4(), name: 'Academic Block 1', code: 'AB1', description: 'Main academic building with lecture halls and labs' },
    { id: uuidv4(), name: 'Academic Block 2', code: 'AB2', description: 'Science and Technology building' },
    { id: uuidv4(), name: 'Academic Block 3', code: 'AB3', description: 'Management and Law building' },
    { id: uuidv4(), name: 'Library Block', code: 'LIB', description: 'Central library and study areas' },
    { id: uuidv4(), name: 'Student Center', code: 'SC', description: 'Cafeteria and student activities' },
    { id: uuidv4(), name: 'Boys Hostel Block A', code: 'BHA', description: 'Boys residential block A' },
    { id: uuidv4(), name: 'Boys Hostel Block B', code: 'BHB', description: 'Boys residential block B' },
    { id: uuidv4(), name: 'Girls Hostel Block A', code: 'GHA', description: 'Girls residential block A' },
    { id: uuidv4(), name: 'Girls Hostel Block B', code: 'GHB', description: 'Girls residential block B' },
    { id: uuidv4(), name: 'Sports Complex', code: 'SPC', description: 'Indoor and outdoor sports facilities' },
  ];

  // Insert buildings
  for (const building of buildings) {
    db.run(`
      INSERT OR IGNORE INTO buildings (id, name, code, description) VALUES (?, ?, ?, ?)
    `, [building.id, building.name, building.code, building.description]);
  }
  console.log(`✅ Inserted ${buildings.length} buildings`);

  // Floors for each building
  const floors = [];
  for (const building of buildings) {
    const numFloors = building.code.startsWith('AB') ? 5 : 
                      building.code === 'LIB' ? 4 : 
                      building.code.includes('H') ? 6 : 3;
    
    for (let i = 0; i <= numFloors; i++) {
      const floorName = i === 0 ? 'Ground Floor' : `Floor ${i}`;
      const floor = { id: uuidv4(), building_id: building.id, floor_number: i, floor_name: floorName };
      floors.push(floor);
      db.run(`
        INSERT OR IGNORE INTO floors (id, building_id, floor_number, floor_name) VALUES (?, ?, ?, ?)
      `, [floor.id, floor.building_id, floor.floor_number, floor.floor_name]);
    }
  }
  console.log(`✅ Inserted ${floors.length} floors`);

  // Washrooms
  let washroomCount = 0;
  for (const floor of floors) {
    const building = buildings.find(b => b.id === floor.building_id);
    
    // Determine gender based on building type
    let genders = ['male', 'female'];
    if (building.code.startsWith('BH')) genders = ['male'];
    if (building.code.startsWith('GH')) genders = ['female'];
    
    for (const gender of genders) {
      const washroomId = uuidv4();
      const qrCode = `BU-${building.code}-F${floor.floor_number}-${gender.charAt(0).toUpperCase()}-${washroomId.slice(0, 8)}`;
      const washroomName = `${building.code} ${floor.floor_name} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Washroom`;
      
      db.run(`
        INSERT OR IGNORE INTO washrooms (id, floor_id, name, gender, qr_code) VALUES (?, ?, ?, ?, ?)
      `, [washroomId, floor.id, washroomName, gender, qrCode]);
      washroomCount++;
    }
  }
  console.log(`✅ Inserted ${washroomCount} washrooms`);

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Buildings: ${buildings.length}`);
  console.log(`   Floors: ${floors.length}`);
  console.log(`   Washrooms: ${washroomCount}`);

  db.close();
}

seedDatabase().catch(console.error);
