import { pgTable, serial, text, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  mlsId: text('mls_id').unique(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  propertyType: text('property_type').notNull(),
  squareFeet: integer('square_feet'),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms'),
  yearBuilt: integer('year_built'),
  lotSize: decimal('lot_size'),
  condition: text('condition'),
  features: jsonb('features'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const valuations = pgTable('valuations', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id),
  estimatedValue: decimal('estimated_value').notNull(),
  confidenceLevel: text('confidence_level').notNull(),
  valueRange: jsonb('value_range').notNull(),
  adjustments: jsonb('adjustments'),
  marketAnalysis: jsonb('market_analysis'),
  modelVersion: text('model_version').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const modelVersions = pgTable('model_versions', {
  id: serial('id').primaryKey(),
  version: text('version').notNull(),
  type: text('type').notNull(),
  parameters: jsonb('parameters').notNull(),
  metrics: jsonb('metrics'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const driftMetrics = pgTable('drift_metrics', {
  id: serial('id').primaryKey(),
  modelVersionId: integer('model_version_id').references(() => modelVersions.id),
  metricType: text('metric_type').notNull(),
  value: decimal('value').notNull(),
  threshold: decimal('threshold').notNull(),
  isAlert: boolean('is_alert').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}); 