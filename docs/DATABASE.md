# Database Documentation

## Overview
This document outlines the database design, schema, and operations for the project.

## Database Architecture

### 1. Database Design
1. Models
```yaml
# Database models configuration
models:
  - name: Property
    fields:
      - name: id
        type: uuid
        primary: true
      - name: address
        type: string
        required: true
      - name: value
        type: decimal
        required: true
      - name: created_at
        type: timestamp
        default: now()
      - name: updated_at
        type: timestamp
        default: now()

  - name: Valuation
    fields:
      - name: id
        type: uuid
        primary: true
      - name: property_id
        type: uuid
        foreign_key: properties.id
      - name: value
        type: decimal
        required: true
      - name: date
        type: date
        required: true
      - name: created_at
        type: timestamp
        default: now()
      - name: updated_at
        type: timestamp
        default: now()

  - name: User
    fields:
      - name: id
        type: uuid
        primary: true
      - name: name
        type: string
        required: true
      - name: email
        type: string
        required: true
        unique: true
      - name: password
        type: string
        required: true
      - name: created_at
        type: timestamp
        default: now()
      - name: updated_at
        type: timestamp
        default: now()
```

2. Relationships
```yaml
# Database relationships configuration
relationships:
  - name: property_valuations
    type: one_to_many
    from: Property
    to: Valuation
    foreign_key: property_id
  - name: user_properties
    type: one_to_many
    from: User
    to: Property
    foreign_key: user_id
```

3. Indexes
```yaml
# Database indexes configuration
indexes:
  - name: property_address
    table: properties
    columns:
      - address
    type: btree
  - name: valuation_date
    table: valuations
    columns:
      - date
    type: btree
  - name: user_email
    table: users
    columns:
      - email
    type: btree
    unique: true
```

### 2. Schema
1. Tables
```sql
-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(255) NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Valuations table
CREATE TABLE valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    value DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

2. Indexes
```sql
-- Property indexes
CREATE INDEX property_address_idx ON properties(address);

-- Valuation indexes
CREATE INDEX valuation_date_idx ON valuations(date);
CREATE INDEX valuation_property_id_idx ON valuations(property_id);

-- User indexes
CREATE UNIQUE INDEX user_email_idx ON users(email);
```

3. Constraints
```sql
-- Property constraints
ALTER TABLE properties
    ADD CONSTRAINT property_value_positive CHECK (value > 0);

-- Valuation constraints
ALTER TABLE valuations
    ADD CONSTRAINT valuation_value_positive CHECK (value > 0),
    ADD CONSTRAINT valuation_date_valid CHECK (date <= CURRENT_DATE);

-- User constraints
ALTER TABLE users
    ADD CONSTRAINT user_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

### 3. Data Types
1. Primary Types
```yaml
# Primary data types configuration
primary_types:
  - name: uuid
    description: "Universally unique identifier"
    size: 16 bytes
  - name: string
    description: "Variable-length character string"
    max_size: 255 bytes
  - name: decimal
    description: "Exact numeric value"
    precision: 12
    scale: 2
  - name: timestamp
    description: "Date and time with timezone"
    format: "YYYY-MM-DD HH:MM:SS.SSSSSS+HH:MM"
```

2. Custom Types
```yaml
# Custom data types configuration
custom_types:
  - name: property_status
    type: enum
    values:
      - active
      - inactive
      - pending
  - name: valuation_type
    type: enum
    values:
      - market
      - assessed
      - estimated
```

3. Composite Types
```yaml
# Composite data types configuration
composite_types:
  - name: address
    fields:
      - name: street
        type: string
      - name: city
        type: string
      - name: state
        type: string
      - name: zip
        type: string
```

## Database Operations

### 1. SQL Queries
1. Select
```sql
-- Select properties
SELECT id, address, value
FROM properties
WHERE value > 500000
ORDER BY value DESC
LIMIT 10;

-- Select valuations
SELECT v.id, p.address, v.value, v.date
FROM valuations v
JOIN properties p ON v.property_id = p.id
WHERE v.date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY v.date DESC;

-- Select users
SELECT id, name, email
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY created_at DESC;
```

2. Insert
```sql
-- Insert property
INSERT INTO properties (address, value)
VALUES ('123 Main St', 500000)
RETURNING id;

-- Insert valuation
INSERT INTO valuations (property_id, value, date)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 550000, CURRENT_DATE)
RETURNING id;

-- Insert user
INSERT INTO users (name, email, password)
VALUES ('John Doe', 'john@example.com', 'hashed_password')
RETURNING id;
```

3. Update
```sql
-- Update property
UPDATE properties
SET value = 600000,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '123e4567-e89b-12d3-a456-426614174000'
RETURNING id;

-- Update valuation
UPDATE valuations
SET value = 650000,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '123e4567-e89b-12d3-a456-426614174000'
RETURNING id;

-- Update user
UPDATE users
SET name = 'Jane Doe',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '123e4567-e89b-12d3-a456-426614174000'
RETURNING id;
```

### 2. Stored Procedures
1. Property Procedures
```sql
-- Create property procedure
CREATE OR REPLACE PROCEDURE create_property(
    p_address VARCHAR,
    p_value DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO properties (address, value)
    VALUES (p_address, p_value);
END;
$$;

-- Update property procedure
CREATE OR REPLACE PROCEDURE update_property(
    p_id UUID,
    p_address VARCHAR,
    p_value DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET address = p_address,
        value = p_value,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;
END;
$$;
```

2. Valuation Procedures
```sql
-- Create valuation procedure
CREATE OR REPLACE PROCEDURE create_valuation(
    p_property_id UUID,
    p_value DECIMAL,
    p_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO valuations (property_id, value, date)
    VALUES (p_property_id, p_value, p_date);
END;
$$;

-- Update valuation procedure
CREATE OR REPLACE PROCEDURE update_valuation(
    p_id UUID,
    p_value DECIMAL,
    p_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE valuations
    SET value = p_value,
        date = p_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;
END;
$$;
```

3. User Procedures
```sql
-- Create user procedure
CREATE OR REPLACE PROCEDURE create_user(
    p_name VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (name, email, password)
    VALUES (p_name, p_email, p_password);
END;
$$;

-- Update user procedure
CREATE OR REPLACE PROCEDURE update_user(
    p_id UUID,
    p_name VARCHAR,
    p_email VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET name = p_name,
        email = p_email,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id;
END;
$$;
```

### 3. Transactions
1. Property Transactions
```sql
-- Property transaction
BEGIN;
    INSERT INTO properties (address, value)
    VALUES ('123 Main St', 500000)
    RETURNING id INTO v_property_id;

    INSERT INTO valuations (property_id, value, date)
    VALUES (v_property_id, 500000, CURRENT_DATE);
COMMIT;
```

2. Valuation Transactions
```sql
-- Valuation transaction
BEGIN;
    UPDATE properties
    SET value = 600000,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_property_id;

    INSERT INTO valuations (property_id, value, date)
    VALUES (v_property_id, 600000, CURRENT_DATE);
COMMIT;
```

3. User Transactions
```sql
-- User transaction
BEGIN;
    INSERT INTO users (name, email, password)
    VALUES ('John Doe', 'john@example.com', 'hashed_password')
    RETURNING id INTO v_user_id;

    INSERT INTO user_properties (user_id, property_id)
    VALUES (v_user_id, v_property_id);
COMMIT;
```

## Database Maintenance

### 1. Backup
1. Full Backup
```yaml
# Full backup configuration
full_backup:
  schedule: "0 0 * * *"
  retention: 7d
  location: /backups/full
  command: pg_dump -Fc -f /backups/full/db_$(date +%Y%m%d).dump
```

2. Incremental Backup
```yaml
# Incremental backup configuration
incremental_backup:
  schedule: "0 */6 * * *"
  retention: 1d
  location: /backups/incremental
  command: pg_dump -Fc -f /backups/incremental/db_$(date +%Y%m%d_%H%M).dump
```

3. Point-in-Time Recovery
```yaml
# Point-in-time recovery configuration
pitr:
  schedule: "0 0 * * *"
  retention: 30d
  location: /backups/pitr
  command: pg_basebackup -D /backups/pitr/$(date +%Y%m%d)
```

### 2. Maintenance
1. Vacuum
```yaml
# Vacuum configuration
vacuum:
  schedule: "0 0 * * *"
  full: true
  analyze: true
  command: VACUUM FULL ANALYZE;
```

2. Reindex
```yaml
# Reindex configuration
reindex:
  schedule: "0 0 * * 0"
  concurrent: true
  command: REINDEX DATABASE app;
```

3. Statistics
```yaml
# Statistics configuration
statistics:
  schedule: "0 0 * * *"
  analyze: true
  command: ANALYZE;
```

### 3. Monitoring
1. Performance
```yaml
# Performance monitoring configuration
performance:
  metrics:
    - name: query_time
      threshold: 1s
    - name: connection_count
      threshold: 100
    - name: cache_hit_ratio
      threshold: 0.95
```

2. Resources
```yaml
# Resource monitoring configuration
resources:
  metrics:
    - name: cpu_usage
      threshold: 80
    - name: memory_usage
      threshold: 80
    - name: disk_usage
      threshold: 80
```

3. Health
```yaml
# Health monitoring configuration
health:
  checks:
    - name: connection
      interval: 1m
    - name: replication
      interval: 1m
    - name: backup
      interval: 1h
``` 