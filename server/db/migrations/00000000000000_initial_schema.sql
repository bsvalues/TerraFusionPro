-- Migration: Initial Schema Migration
-- Generated: 2025-05-08
-- Description: Sets up the initial database schema and adds schema version tracking

-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT
);

-- Insert initial version record
INSERT INTO schema_version (version, description)
VALUES ('20250508000000', 'Initial schema version');

-- Create migration tracking table for Drizzle
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Record this migration in Drizzle migrations
INSERT INTO __drizzle_migrations (hash)
VALUES ('00000000000000_initial_schema');

-- Add other schema changes or initial schema setup here if needed