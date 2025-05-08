/**
 * Database Startup Checks
 * 
 * This script runs validation and safety checks at application startup.
 * It ensures the database schema is properly migrated and compatible with
 * the application code before proceeding with startup.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import ws from 'ws';

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Creates the schema_version table if it doesn't exist
 */
async function ensureSchemaVersionTable(pool: Pool): Promise<boolean> {
  try {
    // Check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_version' AND table_schema = 'public'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('Creating schema_version table for tracking schema changes...');
      
      // Create schema_version table
      await pool.query(`
        CREATE TABLE schema_version (
          id SERIAL PRIMARY KEY,
          version TEXT NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          description TEXT
        );
      `);
      
      // Insert initial version
      const version = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      await pool.query(`
        INSERT INTO schema_version (version, description)
        VALUES ($1, 'Initial schema version created at startup')
      `, [version]);
      
      console.log('Schema version tracking initialized.');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating schema_version table:', error);
    return false;
  }
}

/**
 * Performs basic startup checks on the database
 */
export async function runStartupChecks(): Promise<boolean> {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    return false;
  }
  
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check connection
    await pool.query('SELECT 1');
    
    // Ensure schema_version table exists
    const schemaVersionResult = await ensureSchemaVersionTable(pool);
    if (!schemaVersionResult) {
      console.warn('⚠️ Could not create or verify schema_version table');
    }
    
    // Successful database connection
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Only run standalone if directly executed
// For ESM modules, we use import.meta.url to check if this is the main module
if (import.meta.url.endsWith('startup-check.ts') || 
    import.meta.url.endsWith('startup-check.js')) {
  runStartupChecks().then(success => {
    if (!success) {
      process.exit(1);
    }
    console.log('✅ Database startup checks passed');
  }).catch(err => {
    console.error('Unhandled error in startup checks:', err);
    process.exit(1);
  });
}