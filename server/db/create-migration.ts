/**
 * Migration Generator
 * 
 * This script creates a new migration file with a timestamp and description.
 * Usage: tsx server/db/create-migration.ts "migration description"
 */
import fs from 'fs';
import path from 'path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Error: Migration name is required');
  console.error('Usage: tsx server/db/create-migration.ts "migration description"');
  process.exit(1);
}

// Create the migrations directory if it doesn't exist
const migrationDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationDir)) {
  console.log('📁 Creating migrations directory...');
  fs.mkdirSync(migrationDir, { recursive: true });
}

// Generate a timestamp for the migration
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0')
].join('');

// Generate a filename with timestamp and slugified name
const slug = migrationName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filename = `${timestamp}_${slug}.ts`;
const filePath = path.join(migrationDir, filename);

// Read the template
const templatePath = path.join(__dirname, 'migration-template.ts');
let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
template = template
  .replace('[MIGRATION_NAME]', migrationName)
  .replace('[MIGRATION_DATE]', now.toISOString())
  .replace('[MIGRATION_DESCRIPTION]', migrationName);

// Write the new migration file
fs.writeFileSync(filePath, template);

console.log(`✅ Created migration: ${filePath}`);