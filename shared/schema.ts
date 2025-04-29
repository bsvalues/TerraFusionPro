import { relations, sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
  real,
  uuid,
  jsonb,
  numeric
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export type Json = unknown;

// User and Authentication
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "assessor",
  "collector",
  "manager",
  "citizen",
  "readonly"
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("readonly"),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Property Domain
export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
  "industrial",
  "agricultural",
  "vacant",
  "exempt"
]);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelId: text("parcel_id").notNull().unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county").notNull(),
  legalDescription: text("legal_description"),
  propertyType: propertyTypeEnum("property_type").notNull(),
  acreage: real("acreage"),
  yearBuilt: integer("year_built"),
  squareFeet: integer("square_feet"),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  lastSaleDate: timestamp("last_sale_date", { mode: "date" }),
  lastSaleAmount: real("last_sale_amount"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Valuation Domain
export const valuationMethodEnum = pgEnum("valuation_method", [
  "market_approach",
  "cost_approach",
  "income_approach",
  "mass_appraisal"
]);

export const valuations = pgTable("valuations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  assessmentYear: integer("assessment_year").notNull(),
  landValue: real("land_value").notNull(),
  improvementValue: real("improvement_value").notNull(),
  totalValue: real("total_value").notNull(),
  valuationMethod: valuationMethodEnum("valuation_method").notNull(),
  effectiveDate: timestamp("effective_date", { mode: "date" }).notNull(),
  appraiserNotes: text("appraiser_notes"),
  prevYearValue: real("prev_year_value"),
  changePercentage: real("change_percentage"),
  approverId: integer("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Tax Domain
export const taxStatusEnum = pgEnum("tax_status", [
  "pending",
  "billed",
  "paid",
  "delinquent",
  "appealed",
  "exempt"
]);

export const taxBills = pgTable("tax_bills", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  valuationId: integer("valuation_id").references(() => valuations.id).notNull(),
  taxYear: integer("tax_year").notNull(),
  millageRate: real("millage_rate").notNull(),
  grossTaxAmount: real("gross_tax_amount").notNull(),
  exemptionAmount: real("exemption_amount").default(0).notNull(),
  netTaxAmount: real("net_tax_amount").notNull(),
  dueDate: timestamp("due_date", { mode: "date" }).notNull(),
  status: taxStatusEnum("status").notNull().default("pending"),
  billDate: timestamp("bill_date", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Exemption types
export const exemptions = pgTable("exemptions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  exemptionType: text("exemption_type").notNull(),
  exemptionAmount: real("exemption_amount").notNull(),
  effectiveDate: timestamp("effective_date", { mode: "date" }).notNull(),
  expirationDate: timestamp("expiration_date", { mode: "date" }),
  documentReference: text("document_reference"),
  isActive: boolean("is_active").notNull().default(true),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Appeals
export const appealStatusEnum = pgEnum("appeal_status", [
  "submitted",
  "under_review",
  "hearing_scheduled",
  "approved",
  "denied",
  "withdrawn"
]);

export const appeals = pgTable("appeals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  valuationId: integer("valuation_id").references(() => valuations.id).notNull(),
  appellantName: text("appellant_name").notNull(),
  appellantEmail: text("appellant_email"),
  appellantPhone: text("appellant_phone"),
  appealReason: text("appeal_reason").notNull(),
  appealDate: timestamp("appeal_date", { mode: "date" }).defaultNow().notNull(),
  status: appealStatusEnum("appeal_status").notNull().default("submitted"),
  hearingDate: timestamp("hearing_date", { mode: "date" }),
  decisionDate: timestamp("decision_date", { mode: "date" }),
  decisionNotes: text("decision_notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Comparable sales for valuation
export const comparableSales = pgTable("comparable_sales", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county").notNull(),
  saleDate: timestamp("sale_date", { mode: "date" }).notNull(),
  saleAmount: real("sale_amount").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  yearBuilt: integer("year_built"),
  squareFeet: integer("square_feet"),
  acreage: real("acreage"),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  distanceToSubject: real("distance_to_subject"),
  adjustedSaleAmount: real("adjusted_sale_amount"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Plugin registration and management
export const pluginStatusEnum = pgEnum("plugin_status", [
  "active",
  "inactive",
  "pending",
  "error"
]);

export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  version: text("version").notNull(),
  description: text("description"),
  entrypoint: text("entrypoint").notNull(),
  status: pluginStatusEnum("status").notNull().default("inactive"),
  config: json("config"),
  dependencies: json("dependencies"),
  installDate: timestamp("install_date", { mode: "date" }).defaultNow().notNull(),
  lastUpdated: timestamp("last_updated", { mode: "date" }).defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// AI Agent configurations
export const aiAgentStatusEnum = pgEnum("ai_agent_status", [
  "active",
  "inactive",
  "training",
  "error"
]);

export const aiAgents = pgTable("ai_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  agentType: text("agent_type").notNull(),
  provider: text("provider").notNull(), // openai, anthropic, etc.
  model: text("model").notNull(), // gpt-4o, claude-3-7-sonnet, etc.
  config: json("config"),
  status: aiAgentStatusEnum("status").notNull().default("inactive"),
  lastTrainingDate: timestamp("last_training_date", { mode: "date" }),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Photo types enum
export const photoTypeEnum = pgEnum("photo_type", [
  "subject_front",
  "subject_rear",
  "subject_interior",
  "comparable",
  "neighborhood",
  "other"
]);

// Photos table definition
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  photoType: photoTypeEnum("photo_type").default("subject_front"),
  url: text("url").notNull(),
  caption: text("caption"),
  dateTaken: timestamp("date_taken", { mode: "date" }),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  metadata: jsonb("metadata")
});

// Sketch types enum
export const sketchTypeEnum = pgEnum("sketch_type", [
  "floor_plan",
  "site_plan",
  "elevation",
  "detail"
]);

// Sketches table definition
export const sketches = pgTable("sketches", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sketchUrl: text("sketch_url"),
  sketchData: text("sketch_data"),
  sketchType: sketchTypeEnum("sketch_type").default("floor_plan"),
  squareFootage: integer("square_footage"),
  scale: text("scale"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Compliance check result enum
export const checkResultEnum = pgEnum("check_result", [
  "pass",
  "fail",
  "warning",
  "info"
]);

// Compliance check severity enum
export const severityEnum = pgEnum("severity", [
  "high",
  "medium",
  "low"
]);

// Compliance checks table definition
export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  checkType: text("check_type").notNull(),
  checkResult: checkResultEnum("check_result").default("info"),
  severity: severityEnum("severity").default("low"),
  description: text("description").notNull(),
  details: text("details"),
  rule: text("rule"),
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull()
});

// API Keys for external access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  scopes: json("scopes").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  lastUsed: timestamp("last_used", { mode: "date" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  valuations: many(valuations, { relationName: "createdValuations" }),
  approvedValuations: many(valuations, { relationName: "approvedValuations" }),
  appeals: many(appeals, { relationName: "assignedAppeals" }),
  plugins: many(plugins, { relationName: "createdPlugins" }),
  updatedPlugins: many(plugins, { relationName: "updatedPlugins" }),
  aiAgents: many(aiAgents, { relationName: "createdAgents" }),
  updatedAiAgents: many(aiAgents, { relationName: "updatedAgents" }),
  apiKeys: many(apiKeys),
  auditLogs: many(auditLogs)
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  valuations: many(valuations),
  taxBills: many(taxBills),
  exemptions: many(exemptions),
  appeals: many(appeals),
  comparableSales: many(comparableSales, { relationName: "comparableProperties" })
}));

export const valuationsRelations = relations(valuations, ({ one, many }) => ({
  property: one(properties, {
    fields: [valuations.propertyId],
    references: [properties.id]
  }),
  creator: one(users, {
    fields: [valuations.createdBy],
    references: [users.id],
    relationName: "createdValuations"
  }),
  approver: one(users, {
    fields: [valuations.approverId],
    references: [users.id],
    relationName: "approvedValuations"
  }),
  taxBills: many(taxBills),
  appeals: many(appeals)
}));

export const taxBillsRelations = relations(taxBills, ({ one }) => ({
  property: one(properties, {
    fields: [taxBills.propertyId],
    references: [properties.id]
  }),
  valuation: one(valuations, {
    fields: [taxBills.valuationId],
    references: [valuations.id]
  })
}));

export const exemptionsRelations = relations(exemptions, ({ one }) => ({
  property: one(properties, {
    fields: [exemptions.propertyId],
    references: [properties.id]
  }),
  approver: one(users, {
    fields: [exemptions.approvedBy],
    references: [users.id]
  })
}));

export const appealsRelations = relations(appeals, ({ one }) => ({
  property: one(properties, {
    fields: [appeals.propertyId],
    references: [properties.id]
  }),
  valuation: one(valuations, {
    fields: [appeals.valuationId],
    references: [valuations.id]
  }),
  assignee: one(users, {
    fields: [appeals.assignedTo],
    references: [users.id],
    relationName: "assignedAppeals"
  })
}));

export const comparableSalesRelations = relations(comparableSales, ({ one }) => ({
  property: one(properties, {
    fields: [comparableSales.propertyId],
    references: [properties.id],
    relationName: "comparableProperties"
  })
}));

export const pluginsRelations = relations(plugins, ({ one }) => ({
  creator: one(users, {
    fields: [plugins.createdBy],
    references: [users.id],
    relationName: "createdPlugins"
  }),
  updater: one(users, {
    fields: [plugins.updatedBy],
    references: [users.id],
    relationName: "updatedPlugins"
  })
}));

export const aiAgentsRelations = relations(aiAgents, ({ one }) => ({
  creator: one(users, {
    fields: [aiAgents.createdBy],
    references: [users.id],
    relationName: "createdAgents"
  }),
  updater: one(users, {
    fields: [aiAgents.updatedBy],
    references: [users.id],
    relationName: "updatedAgents"
  })
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));

// Relations for sketches
export const sketchesRelations = relations(sketches, ({ one }) => ({
  report: one(valuations, {
    fields: [sketches.reportId],
    references: [valuations.id],
    relationName: "reportSketches"
  })
}));

// Relations for compliance checks
export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  report: one(valuations, {
    fields: [complianceChecks.reportId],
    references: [valuations.id],
    relationName: "reportComplianceChecks"
  })
}));

// Real Estate Term Glossary
export const realEstateTerms = pgTable("real_estate_terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category").notNull(),
  contextualExplanation: text("contextual_explanation"),
  examples: json("examples").$type<string[]>().default([]),
  relatedTerms: json("related_terms").$type<string[]>().default([]),
  isCommon: boolean("is_common").default(false).notNull(),
  source: text("source"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull()
});

// Field Notes for Property Inspections
export const fieldNotes = pgTable("field_notes", {
  id: text("id").primaryKey(), // UUID stored as text
  parcelId: text("parcel_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  createdBy: text("created_by").notNull(),
  userId: integer("user_id").notNull()
});

// Zod Schemas for data validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true, updatedAt: true });
export const selectPropertySchema = createSelectSchema(properties);
export type Property = z.infer<typeof selectPropertySchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export const insertValuationSchema = createInsertSchema(valuations).omit({ id: true, createdAt: true, updatedAt: true });
export const selectValuationSchema = createSelectSchema(valuations);
export type Valuation = z.infer<typeof selectValuationSchema>;
export type InsertValuation = z.infer<typeof insertValuationSchema>;

// Alias for appraisal reports (valuations are used as appraisal reports in the system)
export const insertAppraisalReportSchema = insertValuationSchema;
export const selectAppraisalReportSchema = selectValuationSchema;
export type AppraisalReport = Valuation;
export type InsertAppraisalReport = InsertValuation;

export const insertTaxBillSchema = createInsertSchema(taxBills).omit({ id: true, createdAt: true, updatedAt: true });
export const selectTaxBillSchema = createSelectSchema(taxBills);
export type TaxBill = z.infer<typeof selectTaxBillSchema>;
export type InsertTaxBill = z.infer<typeof insertTaxBillSchema>;

export const insertExemptionSchema = createInsertSchema(exemptions).omit({ id: true, createdAt: true, updatedAt: true });
export const selectExemptionSchema = createSelectSchema(exemptions);
export type Exemption = z.infer<typeof selectExemptionSchema>;
export type InsertExemption = z.infer<typeof insertExemptionSchema>;

export const insertAppealSchema = createInsertSchema(appeals).omit({ id: true, createdAt: true, updatedAt: true });
export const selectAppealSchema = createSelectSchema(appeals);
export type Appeal = z.infer<typeof selectAppealSchema>;
export type InsertAppeal = z.infer<typeof insertAppealSchema>;

export const insertComparableSaleSchema = createInsertSchema(comparableSales).omit({ id: true, createdAt: true, updatedAt: true });
export const selectComparableSaleSchema = createSelectSchema(comparableSales);
export type ComparableSale = z.infer<typeof selectComparableSaleSchema>;
export type InsertComparableSale = z.infer<typeof insertComparableSaleSchema>;

export const insertPluginSchema = createInsertSchema(plugins).omit({ id: true, createdAt: true, updatedAt: true, installDate: true, lastUpdated: true });
export const selectPluginSchema = createSelectSchema(plugins);
export type Plugin = z.infer<typeof selectPluginSchema>;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, createdAt: true, updatedAt: true });
export const selectAiAgentSchema = createSelectSchema(aiAgents);
export type AiAgent = z.infer<typeof selectAiAgentSchema>;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, updatedAt: true, lastUsed: true });
export const selectApiKeySchema = createSelectSchema(apiKeys);
export type ApiKey = z.infer<typeof selectApiKeySchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export const selectAuditLogSchema = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertRealEstateTermSchema = createInsertSchema(realEstateTerms).omit({ id: true, createdAt: true, updatedAt: true });
export const selectRealEstateTermSchema = createSelectSchema(realEstateTerms);
export type RealEstateTerm = z.infer<typeof selectRealEstateTermSchema>;
export type InsertRealEstateTerm = z.infer<typeof insertRealEstateTermSchema>;

export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true, createdAt: true });
export const selectPhotoSchema = createSelectSchema(photos);
export type Photo = z.infer<typeof selectPhotoSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export const insertSketchSchema = createInsertSchema(sketches).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSketchSchema = createSelectSchema(sketches);
export type Sketch = z.infer<typeof selectSketchSchema>;
export type InsertSketch = z.infer<typeof insertSketchSchema>;

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({ id: true, createdAt: true });
export const selectComplianceCheckSchema = createSelectSchema(complianceChecks);
export type ComplianceCheck = z.infer<typeof selectComplianceCheckSchema>;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

export const insertFieldNoteSchema = createInsertSchema(fieldNotes).omit({ createdAt: true });
export const selectFieldNoteSchema = createSelectSchema(fieldNotes);
export type FieldNote = z.infer<typeof selectFieldNoteSchema>;
export type InsertFieldNote = z.infer<typeof insertFieldNoteSchema>;

// Zod validation schema for field notes validation
export const fieldNoteSchema = z.object({
  id: z.string().uuid().optional(),
  parcelId: z.string(),
  text: z.string(),
  createdAt: z.string().or(z.date()).optional(),
  createdBy: z.string(),
  userId: z.number()
});