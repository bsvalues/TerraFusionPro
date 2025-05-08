/**
 * Database Startup Check
 * 
 * This module performs schema validation during application startup.
 * It's designed to be imported and used in server/index.ts.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import fs from 'fs';
import path from 'path';

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

/**
 * Check if database connection is available
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL must be set');
    return false;
  }

  let pool: Pool | null = null;
  
  try {
    console.log('🔌 Checking database connection...');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Execute a simple query to verify connection
    const result = await pool.query('SELECT 1 as result');
    if (result.rows[0]?.result === 1) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.error('❌ Database connection failed: Unexpected query result');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Check if schema version is compatible with application
 */
export async function checkSchemaVersion(minSchemaVersion: string = ''): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL must be set');
    return false;
  }

  let pool: Pool | null = null;
  
  try {
    console.log('🔄 Checking schema version...');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check if schema_version table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_version'
      );
    `);
    
    if (!tableCheck.rows[0]?.exists) {
      console.warn('⚠️ Schema version table does not exist. Creating it...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE schema_version (
          id SERIAL PRIMARY KEY,
          version TEXT NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          description TEXT
        );
      `);
      
      // Insert initial version
      const initialVersion = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      await pool.query(`
        INSERT INTO schema_version (version, description)
        VALUES ($1, 'Initial schema version');
      `, [initialVersion]);
      
      console.log(`✅ Created schema_version table with initial version ${initialVersion}`);
      return true;
    }
    
    // Get latest schema version
    const versionResult = await pool.query(`
      SELECT version FROM schema_version 
      ORDER BY applied_at DESC 
      LIMIT 1;
    `);
    
    if (versionResult.rows.length === 0) {
      console.warn('⚠️ No schema version found in database');
      return false;
    }
    
    const currentVersion = versionResult.rows[0].version;
    console.log(`📋 Current schema version: ${currentVersion}`);
    
    // If minimum version is specified, check compatibility
    if (minSchemaVersion && currentVersion < minSchemaVersion) {
      console.error(`❌ Schema version ${currentVersion} is older than required minimum ${minSchemaVersion}`);
      console.error('Please run migrations to update the database schema');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking schema version:', error);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Check if there are pending migrations
 */
export async function checkPendingMigrations(): Promise<boolean> {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // If migrations directory doesn't exist or is empty, no pending migrations
  if (!fs.existsSync(migrationsDir) || fs.readdirSync(migrationsDir).length === 0) {
    return false;
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL must be set');
    return false;
  }

  let pool: Pool | null = null;
  
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check if migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      );
    `);
    
    if (!tableCheck.rows[0]?.exists) {
      // No migrations table means there might be pending migrations
      console.warn('⚠️ Migrations table does not exist. There may be pending migrations.');
      return true;
    }
    
    // Get applied migrations
    const appliedMigrations = await pool.query(`
      SELECT hash FROM __drizzle_migrations;
    `);
    
    const appliedHashes = appliedMigrations.rows.map(row => row.hash);
    
    // Get migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'));
    
    // If there are more files than applied migrations, there might be pending migrations
    if (migrationFiles.length > appliedHashes.length) {
      console.warn('⚠️ There may be pending migrations');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking pending migrations:', error);
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

/**
 * Run all startup checks
 */
export async function runStartupChecks(options = { 
  exitOnFailure: true,
  minSchemaVersion: ''
}): Promise<boolean> {
  console.log('🚀 Running database startup checks...');
  
  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk && options.exitOnFailure) {
    console.error('❌ Database connection check failed');
    process.exit(1);
  }
  
  const schemaVersionOk = await checkSchemaVersion(options.minSchemaVersion);
  if (!schemaVersionOk && options.exitOnFailure) {
    console.error('❌ Schema version check failed');
    process.exit(1);
  }
  
  const pendingMigrations = await checkPendingMigrations();
  if (pendingMigrations) {
    console.warn('⚠️ There appear to be pending migrations. Run migrations to update the database schema.');
  }
  
  console.log('✅ All database startup checks completed');
  return connectionOk && schemaVersionOk;
}