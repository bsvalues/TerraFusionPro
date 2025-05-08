/**
 * Database Schema Validation
 * 
 * This script validates the database schema against the application models
 * to ensure they are in sync. It can be run before startup to prevent
 * runtime errors due to schema mismatches.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../../shared/schema';
import ws from 'ws';

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

// Environment validation
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set');
  process.exit(1);
}

async function checkSchema() {
  console.log('🔍 Starting database schema validation...');
  
  // Connect to the database
  console.log('🔌 Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Get list of tables from the database
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const dbTables = tablesResult.rows.map(row => row.tablename);
    console.log(`📊 Found ${dbTables.length} tables in database`);
    
    // Get schema tables from Drizzle models
    const schemaTableNames = Object.keys(schema)
      .filter(key => key.endsWith('Relations') === false)
      .filter(key => typeof schema[key] === 'object' && schema[key] !== null);
    
    // Convert camelCase schema names to snake_case for comparison
    const expectedTableNames = schemaTableNames.map(name => 
      name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    );
    
    console.log(`📝 Found ${expectedTableNames.length} tables in schema`);
    
    // Check for missing tables
    const missingTables = expectedTableNames.filter(table => !dbTables.includes(table));
    if (missingTables.length > 0) {
      console.warn(`⚠️ Warning: The following tables exist in schema but not in database: ${missingTables.join(', ')}`);
      console.warn('Run migrations to create these tables!');
    } else {
      console.log('✅ All schema tables exist in database');
    }
    
    // Check for column mismatches in each table
    const columnMismatches = [];
    
    for (const tableName of dbTables) {
      // Skip migration tables and schema_version
      if (tableName.startsWith('__drizzle') || tableName === 'schema_version') {
        continue;
      }
      
      // Query for columns in this table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tableName]);
      
      const dbColumns = columnsResult.rows.map(row => row.column_name);
      
      // Find corresponding schema table (convert snake_case to camelCase)
      const schemaTableName = tableName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // If we have this table in our schema, compare columns
      if (schema[schemaTableName]) {
        const schemaTable = schema[schemaTableName];
        // Get expected columns from schema, excluding symbol properties
        const schemaColumns = Object.getOwnPropertyNames(schemaTable)
          .filter(key => typeof key === 'string' && !key.startsWith('_'));
        
        // Convert camelCase to snake_case for column names
        const expectedColumns = schemaColumns.map(col => 
          col.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        );
        
        // Find missing columns
        const missingColumns = expectedColumns.filter(col => !dbColumns.includes(col));
        if (missingColumns.length > 0) {
          columnMismatches.push({
            table: tableName,
            missingColumns
          });
        }
      }
    }
    
    if (columnMismatches.length > 0) {
      console.warn('⚠️ Warning: Found column mismatches between schema and database:');
      columnMismatches.forEach(mismatch => {
        console.warn(`Table ${mismatch.table} is missing columns: ${mismatch.missingColumns.join(', ')}`);
      });
      console.warn('Run migrations to update these tables!');
    } else {
      console.log('✅ No column mismatches detected');
    }
    
    // Get current schema version if available
    try {
      const versionResult = await pool.query(`
        SELECT version, applied_at
        FROM schema_version
        ORDER BY applied_at DESC
        LIMIT 1
      `);
      
      if (versionResult.rows.length > 0) {
        const { version, applied_at } = versionResult.rows[0];
        console.log(`📋 Current schema version: ${version} (applied at ${applied_at})`);
      } else {
        console.warn('⚠️ Warning: No schema version found in database');
      }
    } catch (e) {
      console.warn('⚠️ Warning: Schema version table does not exist');
    }
    
    console.log('✅ Schema validation completed');
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the validation
checkSchema().then(isValid => {
  if (!isValid) {
    process.exit(1);
  }
}).catch(err => {
  console.error('Unhandled error in schema validation:', err);
  process.exit(1);
});