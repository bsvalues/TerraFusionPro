import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { and, eq, or, isNull, sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle with schema
export const db = drizzle({ client: pool, schema });

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