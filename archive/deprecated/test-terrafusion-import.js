import { TerraFusionImportEngine } from './server/services/import-engine.js';
import path from 'path';
import fs from 'fs/promises';

async function createTestSqliteDatabase() {
  const { default: sqlite3 } = await import('sqlite3');
  const dbPath = path.join(process.cwd(), 'temp', 'test-properties.sqlite');
  
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.verbose().Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS properties (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT NOT NULL,
          sale_price REAL NOT NULL,
          gla INTEGER NOT NULL,
          sale_date TEXT NOT NULL,
          property_type TEXT,
          bedrooms INTEGER,
          bathrooms REAL,
          year_built INTEGER,
          lot_size REAL,
          city TEXT,
          state TEXT,
          zip_code TEXT
        )`);
        
        const sampleData = [
          ['123 Main St', 450000, 2200, '2024-01-15', 'Single Family', 4, 2.5, 2005, 0.25, 'Seattle', 'WA', '98101'],
          ['456 Oak Ave', 525000, 2800, '2024-02-20', 'Single Family', 5, 3, 2010, 0.30, 'Seattle', 'WA', '98102'],
          ['789 Pine Rd', 375000, 1800, '2024-03-10', 'Townhouse', 3, 2, 2015, 0.15, 'Seattle', 'WA', '98103']
        ];
        
        const stmt = db.prepare(`INSERT INTO properties 
          (address, sale_price, gla, sale_date, property_type, bedrooms, bathrooms, year_built, lot_size, city, state, zip_code) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        sampleData.forEach(row => {
          stmt.run(row);
        });
        
        stmt.finalize();
        
        db.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(dbPath);
          }
        });
      });
    });
  });
}

async function testTerraFusionImport() {
  console.log('=== TerraFusion Import Engine Test ===\n');
  
  try {
    console.log('1. Creating test SQLite database...');
    const dbPath = await createTestSqliteDatabase();
    console.log(`✓ Test database created: ${dbPath}\n`);
    
    console.log('2. Testing format detection...');
    const format = await TerraFusionImportEngine.detectFormat(dbPath);
    console.log(`✓ Detected format: ${format}\n`);
    
    console.log('3. Getting supported formats...');
    const formats = await TerraFusionImportEngine.getSupportedFormats();
    console.log('✓ Supported formats:');
    formats.forEach(f => {
      console.log(`   - ${f.name}: ${f.extensions.join(', ')}`);
    });
    console.log('');
    
    console.log('4. Importing SQLite data...');
    const result = await TerraFusionImportEngine.importFile(dbPath);
    
    if (result.success) {
      console.log('✓ Import successful!');
      console.log(`   - Total records: ${result.stats.totalRecords}`);
      console.log(`   - Valid records: ${result.stats.validRecords}`);
      console.log(`   - Processing time: ${result.stats.processingTimeMs}ms\n`);
      
      console.log('5. Sample imported data:');
      if (result.data && result.data.length > 0) {
        result.data.slice(0, 2).forEach((comp, index) => {
          console.log(`   Record ${index + 1}:`);
          console.log(`     Address: ${comp.address}`);
          console.log(`     Sale Price: $${comp.sale_price_usd.toLocaleString()}`);
          console.log(`     Square Feet: ${comp.gla_sqft}`);
          console.log(`     Sale Date: ${comp.sale_date}`);
          console.log(`     Source: ${comp.source_file} (${comp.source_table})`);
          console.log('');
        });
      }
      
      console.log('6. Validating imported data...');
      const { valid, invalid } = await TerraFusionImportEngine.validateImportedData(result.data || []);
      console.log(`✓ Validation complete: ${valid.length} valid, ${invalid.length} invalid\n`);
      
    } else {
      console.error('✗ Import failed:', result.error);
      console.log('Stats:', result.stats);
    }
    
    console.log('7. Cleaning up...');
    await fs.unlink(dbPath);
    console.log('✓ Test database removed\n');
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTerraFusionImport();
}

export { testTerraFusionImport };