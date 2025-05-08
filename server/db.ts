import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { and, eq, or, isNull, sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "../shared/schema";
import fs from "fs";
import path from "path";

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Increase connection timeout for more stability
  connectionTimeoutMillis: 10000 
});

// Initialize Drizzle with schema
export const db = drizzle({ client: pool, schema });

// Check if schema version is tracked
export async function ensureSchemaVersionTable() {
  try {
    // Check if schema_version table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_version'
      );
    `);
    
    if (!result.rows[0]?.exists) {
      console.log('Creating schema_version table for tracking schema changes...');
      
      // Create schema version table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_version (
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
        VALUES ($1, 'Initial schema version');
      `, [version]);
      
      console.log('Schema version tracking initialized.');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up schema version tracking:', error);
    return false;
  }
}

// Log current schema version
export async function logCurrentSchemaVersion() {
  try {
    const result = await pool.query(`
      SELECT version, applied_at FROM schema_version 
      ORDER BY applied_at DESC LIMIT 1;
    `);
    
    if (result.rows.length > 0) {
      const { version, applied_at } = result.rows[0];
      console.log(`Database schema version: ${version} (applied at ${applied_at})`);
    } else {
      console.warn('No schema version information found.');
    }
  } catch (error) {
    console.error('Error retrieving schema version:', error);
  }
}

// Setup schema version tracking on import
ensureSchemaVersionTable().catch(err => {
  console.error('Failed to initialize schema version tracking:', err);
});

/**
 * Find a property using flexible identifier matching
 * This function allows us to look up properties by any of their identifier fields
 * (parcel_id, tax_parcel_id, property_identifier, etc.)
 * 
 * @param identifier - The property identifier to search for
 * @returns The property or null if not found
 */
export async function findPropertyByAnyIdentifier(identifier: string) {
  try {
    const properties = await db.select()
      .from(schema.properties)
      .where(
        or(
          eq(schema.properties.parcelId, identifier),
          eq(schema.properties.taxParcelId, identifier),
          eq(schema.properties.propertyIdentifier, identifier),
          sql`LOWER(${schema.properties.address}) LIKE LOWER(${'%' + identifier + '%'})`,
        )
      )
      .limit(1);

    return properties.length > 0 ? properties[0] : null;
  } catch (error) {
    console.error('Error finding property by identifier:', error);
    // Add error details to help diagnose missing columns
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      // If it's a database column error, provide more helpful context
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('Flexible identifier system error: This might be a schema mismatch between your code and database.');
        console.error('Available columns in the properties table can be checked with: \\d properties');
      }
    }
    return null;
  }
}