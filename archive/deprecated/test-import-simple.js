import { TerraFusionImportEngine } from './server/services/import-engine.js';

async function testImportEngine() {
  console.log('=== TerraFusion Import Engine Test ===\n');
  
  try {
    console.log('1. Testing format detection...');
    const sqliteFormat = await TerraFusionImportEngine.detectFormat('test.sqlite');
    const dbFormat = await TerraFusionImportEngine.detectFormat('test.db');
    const csvFormat = await TerraFusionImportEngine.detectFormat('test.csv');
    
    console.log(`✓ SQLite format: ${sqliteFormat}`);
    console.log(`✓ DB format: ${dbFormat}`);
    console.log(`✓ CSV format: ${csvFormat}\n`);
    
    console.log('2. Getting supported formats...');
    const formats = await TerraFusionImportEngine.getSupportedFormats();
    console.log('✓ Supported formats:');
    formats.forEach(f => {
      console.log(`   - ${f.name}: ${f.extensions.join(', ')}`);
    });
    console.log('');
    
    console.log('3. Testing validation...');
    const sampleData = [
      {
        id: '1',
        address: '123 Main St',
        sale_price_usd: 450000,
        gla_sqft: 2200,
        sale_date: '2024-01-15',
        source_file: 'test.sqlite',
        source_table: 'properties'
      }
    ];
    
    const { valid, invalid } = await TerraFusionImportEngine.validateImportedData(sampleData);
    console.log(`✓ Validation: ${valid.length} valid, ${invalid.length} invalid\n`);
    
    console.log('=== Test Complete ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testImportEngine();