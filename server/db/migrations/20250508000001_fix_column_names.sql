-- Migration: Fix Column Names (camelCase to snake_case) - Safe Version
-- Date: 2025-05-08
-- Description: This migration safely checks for column existence before renaming

-- Create a function to check if a column exists before attempting to rename it
CREATE OR REPLACE FUNCTION rename_if_exists(
    table_name TEXT,
    old_column TEXT,
    new_column TEXT
) RETURNS void AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if the old column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = rename_if_exists.table_name
          AND column_name = rename_if_exists.old_column
    ) INTO column_exists;
    
    -- If the column exists, rename it
    IF column_exists THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', 
                      table_name, old_column, new_column);
        RAISE NOTICE 'Renamed column % to % in table %', 
                     old_column, new_column, table_name;
    ELSE
        RAISE NOTICE 'Column % does not exist in table %, no action taken', 
                     old_column, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix any affected foreign key constraints
-- Example:
-- ALTER TABLE related_table
-- DROP CONSTRAINT related_table_oldColumnName_fkey,
-- ADD CONSTRAINT related_table_new_column_name_fkey 
--   FOREIGN KEY (new_column_name) REFERENCES target_table(id);

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20250508000001', 'Fix column names (camelCase to snake_case)');