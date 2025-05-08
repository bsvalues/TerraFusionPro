/**
 * Migration File Generator
 * 
 * This script creates a new migration file with the provided description.
 * Usage: npx tsx server/db/create-migration.ts "Description of migration"
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a new migration file
 */
function createMigration(description: string): void {
  // Create timestamp identifier for the migration
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const migrationName = `${timestamp}_${description.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  const migrationPath = path.join(__dirname, 'migrations', `${migrationName}.sql`);
  
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 Creating migrations directory...');
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Check if the migration already exists
  if (fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file already exists: ${migrationPath}`);
    process.exit(1);
  }
  
  // Create the migration template
  const template = `-- Migration: ${description}
-- Generated: ${new Date().toISOString().split('T')[0]}
-- Description: ${description}

-- Your SQL goes here

-- Example: Add a column
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (
--         SELECT FROM information_schema.columns 
--         WHERE table_name = 'table_name' 
--         AND column_name = 'column_name'
--         AND table_schema = 'public'
--     ) THEN
--         ALTER TABLE table_name ADD COLUMN column_name TEXT;
--     END IF;
-- END $$;

-- Example: Create a table
-- CREATE TABLE IF NOT EXISTS table_name (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Update schema version
INSERT INTO schema_version (version, description)
VALUES ('${timestamp}', '${description}');

-- Record this migration
INSERT INTO __drizzle_migrations (hash)
VALUES ('${migrationName}');
`;
  
  // Write the template to the file
  fs.writeFileSync(migrationPath, template);
  
  console.log(`✅ Migration file created: ${migrationPath}`);
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Migration description is required');
  console.error('Usage: npx tsx server/db/create-migration.ts "Description of migration"');
  process.exit(1);
}

const description = args[0];
createMigration(description);