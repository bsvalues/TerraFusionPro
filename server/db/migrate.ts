/**
 * Database Migration Runner
 * 
 * This script manages the execution of database migrations and ensures
 * the database schema is up-to-date with the application's models.
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '../../shared/schema';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

// Environment validation
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set');
  process.exit(1);
}

async function main() {
  console.log('🔄 Starting database migration process...');
  
  // Create the migrations directory if it doesn't exist
  const migrationDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationDir)) {
    console.log('📁 Creating migrations directory...');
    fs.mkdirSync(migrationDir, { recursive: true });
    console.log('✓ Migrations directory created');
  }
  
  // Connect to the database
  console.log('🔌 Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Run migrations
    console.log('📊 Applying migrations...');
    
    // Create migrations table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at timestamptz DEFAULT now()
        )
      `);
    } catch (error) {
      console.error('Error creating migrations table:', error);
      process.exit(1);
    }
    
    // Run the migrations
    await migrate(db, { migrationsFolder: 'migrations' });
    
    console.log('✅ Database migration completed successfully');
    
    // Create version tracking table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_version (
          id SERIAL PRIMARY KEY,
          version TEXT NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          description TEXT
        )
      `);
      
      // Insert current version based on timestamp if not exists
      const version = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const description = 'Migration applied via migrate.ts';
      
      await pool.query(`
        INSERT INTO schema_version (version, description)
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM schema_version WHERE version = $1
        )
      `, [version, description]);
      
      // Get current version
      const result = await pool.query('SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1');
      if (result.rows.length > 0) {
        console.log(`📝 Current schema version: ${result.rows[0].version}`);
      }
    } catch (error) {
      console.error('Error tracking schema version:', error);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await pool.end();
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error in migration process:', err);
  process.exit(1);
});