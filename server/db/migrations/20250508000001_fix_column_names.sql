-- Migration: Fix Column Names
-- Generated: 2025-05-08
-- Description: Fixes mismatches between code schema column names and database column names

-- First check if column exists before trying to create it
DO $$ 
BEGIN
    -- Fix order_status column if needed
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders RENAME COLUMN status TO order_status;
    END IF;

    -- Handle tax_parcel_id column if needed
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'tax_id'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'tax_parcel_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE properties RENAME COLUMN tax_id TO tax_parcel_id;
    END IF;
END $$;

-- Update schema version
INSERT INTO schema_version (version, description)
VALUES ('20250508000001', 'Fix column name mismatches between code and database');

-- Record this migration
INSERT INTO __drizzle_migrations (hash)
VALUES ('20250508000001_fix_column_names');