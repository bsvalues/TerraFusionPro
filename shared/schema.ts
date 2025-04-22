import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
export type Json = Record<string, any>;

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  company: text("company"),
  licenseNumber: text("license_number"),
  email: text("email").unique(),
  phoneNumber: text("phone_number"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  company: true,
  licenseNumber: true,
  email: true,
  phoneNumber: true,
});

// Property model
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county"),
  legalDescription: text("legal_description"),
  taxParcelId: text("tax_parcel_id"),
  propertyType: text("property_type").notNull(),
  yearBuilt: integer("year_built"),
  effectiveAge: integer("effective_age"),
  grossLivingArea: numeric("gross_living_area"),
  lotSize: numeric("lot_size"),
  bedrooms: numeric("bedrooms"),
  bathrooms: numeric("bathrooms"),
  basement: text("basement"),
  garage: text("garage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  userId: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  county: true,
  legalDescription: true,
  taxParcelId: true,
  propertyType: true,
  yearBuilt: true,
  effectiveAge: true,
  grossLivingArea: true,
  lotSize: true,
  bedrooms: true,
  bathrooms: true,
  basement: true,
  garage: true,
});

// Appraisal Report model
export const appraisalReports = pgTable("appraisal_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  reportType: text("report_type").notNull(),
  formType: text("form_type").notNull(),
  status: text("status").notNull().default("draft"),
  purpose: text("purpose"),
  effectiveDate: timestamp("effective_date"),
  reportDate: timestamp("report_date"),
  clientName: text("client_name"),
  clientAddress: text("client_address"),
  lenderName: text("lender_name"),
  lenderAddress: text("lender_address"),
  borrowerName: text("borrower_name"),
  occupancy: text("occupancy"),
  salesPrice: numeric("sales_price"),
  marketValue: numeric("market_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAppraisalReportSchema = createInsertSchema(appraisalReports).pick({
  userId: true,
  propertyId: true,
  reportType: true,
  formType: true,
  status: true,
  purpose: true,
  effectiveDate: true,
  reportDate: true,
  clientName: true,
  clientAddress: true,
  lenderName: true,
  lenderAddress: true,
  borrowerName: true,
  occupancy: true,
  salesPrice: true,
  marketValue: true,
});

// Comparable model
export const comparables = pgTable("comparables", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  compType: text("comp_type").notNull(), // e.g., "sale", "listing", "rental"
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  proximityToSubject: text("proximity_to_subject"),
  salePrice: numeric("sale_price"),
  pricePerSqFt: numeric("price_per_sqft"),
  saleDate: timestamp("sale_date"),
  saleOrFinancingConcessions: text("sale_or_financing_concessions"),
  locationRating: text("location_rating"),
  siteSize: numeric("site_size"),
  siteUnit: text("site_unit").default("sq ft"),
  view: text("view"),
  design: text("design"),
  quality: text("quality"),
  age: integer("age"),
  condition: text("condition"),
  aboveGradeRooms: integer("above_grade_rooms"),
  bedrooms: numeric("bedrooms"),
  bathrooms: numeric("bathrooms"),
  grossLivingArea: numeric("gross_living_area"),
  basement: text("basement"),
  basementFinished: text("basement_finished"),
  functionalUtility: text("functional_utility"),
  heatingCooling: text("heating_cooling"),
  garage: text("garage"),
  porchPatiosDeck: text("porch_patios_deck"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComparableSchema = createInsertSchema(comparables).pick({
  reportId: true,
  compType: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  proximityToSubject: true,
  salePrice: true,
  pricePerSqFt: true,
  saleDate: true,
  saleOrFinancingConcessions: true,
  locationRating: true,
  siteSize: true,
  siteUnit: true,
  view: true,
  design: true,
  quality: true,
  age: true,
  condition: true,
  aboveGradeRooms: true,
  bedrooms: true,
  bathrooms: true,
  grossLivingArea: true,
  basement: true,
  basementFinished: true,
  functionalUtility: true,
  heatingCooling: true,
  garage: true,
  porchPatiosDeck: true,
});

// Adjustments model
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  adjustmentType: text("adjustment_type").notNull(), // e.g., "sale_concessions", "time", "location", etc.
  description: text("description"),
  amount: numeric("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentSchema = createInsertSchema(adjustments).pick({
  reportId: true,
  comparableId: true,
  adjustmentType: true,
  description: true,
  amount: true,
});

// Photos model
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  photoType: text("photo_type").notNull(), // e.g., "subject_front", "subject_rear", "street_scene", etc.
  url: text("url").notNull(),
  caption: text("caption"),
  dateTaken: timestamp("date_taken"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  reportId: true,
  photoType: true,
  url: true,
  caption: true,
  dateTaken: true,
  latitude: true,
  longitude: true,
});

// Sketches model
export const sketches = pgTable("sketches", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  sketchType: text("sketch_type").notNull(), // e.g., "floor_plan", "site_plan", etc.
  data: jsonb("data").notNull(), // Store sketch data as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSketchSchema = createInsertSchema(sketches).pick({
  reportId: true,
  sketchType: true,
  data: true,
});

// Adjustment Models
export const adjustmentModels = pgTable("adjustment_models", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  name: text("name").notNull(),
  description: text("description"),
  modelType: text("model_type").notNull(), // manual, ai-generated, market-derived, hybrid
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentModelSchema = createInsertSchema(adjustmentModels).pick({
  reportId: true,
  name: true,
  description: true,
  modelType: true,
  metadata: true,
});

// Model Adjustments - adjustments that are part of specific adjustment models
export const modelAdjustments = pgTable("model_adjustments", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => adjustmentModels.id),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  adjustmentType: text("adjustment_type").notNull(),
  description: text("description"),
  amount: numeric("amount").notNull(),
  confidence: numeric("confidence"), // For AI-generated adjustments
  reasoning: text("reasoning"), // Explanation for the adjustment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertModelAdjustmentSchema = createInsertSchema(modelAdjustments).pick({
  modelId: true,
  comparableId: true,
  adjustmentType: true,
  description: true,
  amount: true,
  confidence: true,
  reasoning: true,
});

// Market Analysis Data
export const marketAnalysis = pgTable("market_analysis", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  analysisType: text("analysis_type").notNull(), // regression, paired_sales, trend
  description: text("description"),
  data: jsonb("data").notNull(), // Store analysis data as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketAnalysisSchema = createInsertSchema(marketAnalysis).pick({
  reportId: true,
  analysisType: true,
  description: true,
  data: true,
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  preferenceName: text("preference_name").notNull(),
  preferenceValue: jsonb("preference_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  preferenceName: true,
  preferenceValue: true,
});

// Adjustment templates
export const adjustmentTemplates = pgTable("adjustment_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull(),
  isPublic: boolean("is_public").default(false),
  templateData: jsonb("template_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentTemplateSchema = createInsertSchema(adjustmentTemplates).pick({
  userId: true,
  name: true,
  description: true,
  propertyType: true,
  isPublic: true,
  templateData: true,
});

// Adjustment rules (condition-based)
export const adjustmentRules = pgTable("adjustment_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  modelId: integer("model_id").references(() => adjustmentModels.id),
  name: text("name").notNull(),
  description: text("description"),
  condition: jsonb("condition").notNull(), // JSON representation of the condition
  adjustmentType: text("adjustment_type").notNull(),
  calculationMethod: text("calculation_method").notNull(), // fixed, percentage, formula
  value: text("value").notNull(), // Could be a fixed amount, percentage, or formula
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdjustmentRuleSchema = createInsertSchema(adjustmentRules).pick({
  userId: true,
  modelId: true,
  name: true,
  description: true,
  condition: true,
  adjustmentType: true,
  calculationMethod: true,
  value: true,
  isActive: true,
});

// Historical adjustments for tracking and auditing
export const adjustmentHistory = pgTable("adjustment_history", {
  id: serial("id").primaryKey(),
  adjustmentId: integer("adjustment_id").references(() => adjustments.id),
  modelAdjustmentId: integer("model_adjustment_id").references(() => modelAdjustments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  actionType: text("action_type").notNull(), // created, updated, deleted
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  reason: text("reason"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAdjustmentHistorySchema = createInsertSchema(adjustmentHistory).pick({
  adjustmentId: true,
  modelAdjustmentId: true,
  userId: true,
  actionType: true,
  previousValue: true,
  newValue: true,
  reason: true,
});

// Collaboration and comments
export const collaborationComments = pgTable("collaboration_comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  comparableId: integer("comparable_id").references(() => comparables.id),
  adjustmentId: integer("adjustment_id").references(() => adjustments.id),
  modelId: integer("model_id").references(() => adjustmentModels.id),
  modelAdjustmentId: integer("model_adjustment_id").references(() => modelAdjustments.id),
  commentText: text("comment_text").notNull(),
  status: text("status").default("open"), // open, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollaborationCommentSchema = createInsertSchema(collaborationComments).pick({
  userId: true,
  reportId: true,
  comparableId: true,
  adjustmentId: true,
  modelId: true,
  modelAdjustmentId: true,
  commentText: true,
  status: true,
});

// Real-time market data
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(), // Could be city, county, zip code, etc.
  dataType: text("data_type").notNull(), // median_price, days_on_market, inventory, etc.
  value: numeric("value").notNull(),
  unit: text("unit").notNull(), // $, days, count, etc.
  datePoint: date("date_point").notNull(),
  source: text("source").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketDataSchema = createInsertSchema(marketData).pick({
  region: true,
  dataType: true,
  value: true,
  unit: true,
  datePoint: true,
  source: true,
  metadata: true,
});

// Compliance model
export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  checkType: text("check_type").notNull(), // e.g., "UAD", "USPAP", "client-specific"
  status: text("status").notNull(), // e.g., "pass", "fail", "warning"
  message: text("message"),
  severity: text("severity").notNull(), // e.g., "critical", "high", "medium", "low"
  field: text("field"), // The field that triggered the compliance issue
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).pick({
  reportId: true,
  checkType: true,
  status: true,
  message: true,
  severity: true,
  field: true,
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  appraisalReports: many(appraisalReports),
  userPreferences: many(userPreferences),
  adjustmentTemplates: many(adjustmentTemplates),
  adjustmentRules: many(adjustmentRules),
  collaborationComments: many(collaborationComments),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  appraisalReports: many(appraisalReports),
}));

export const appraisalReportsRelations = relations(appraisalReports, ({ one, many }) => ({
  user: one(users, {
    fields: [appraisalReports.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [appraisalReports.propertyId],
    references: [properties.id],
  }),
  comparables: many(comparables),
  adjustments: many(adjustments),
  photos: many(photos),
  sketches: many(sketches),
  complianceChecks: many(complianceChecks),
  adjustmentModels: many(adjustmentModels),
  marketAnalysis: many(marketAnalysis),
}));

export const comparablesRelations = relations(comparables, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [comparables.reportId],
    references: [appraisalReports.id],
  }),
  adjustments: many(adjustments),
  modelAdjustments: many(modelAdjustments),
}));

export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [adjustments.reportId],
    references: [appraisalReports.id],
  }),
  comparable: one(comparables, {
    fields: [adjustments.comparableId],
    references: [comparables.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [photos.reportId],
    references: [appraisalReports.id],
  }),
}));

export const sketchesRelations = relations(sketches, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [sketches.reportId],
    references: [appraisalReports.id],
  }),
}));

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [complianceChecks.reportId],
    references: [appraisalReports.id],
  }),
}));

// Relations for adjustment models
export const adjustmentModelsRelations = relations(adjustmentModels, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [adjustmentModels.reportId],
    references: [appraisalReports.id],
  }),
  modelAdjustments: many(modelAdjustments),
}));

// Relations for model adjustments
export const modelAdjustmentsRelations = relations(modelAdjustments, ({ one }) => ({
  model: one(adjustmentModels, {
    fields: [modelAdjustments.modelId],
    references: [adjustmentModels.id],
  }),
  comparable: one(comparables, {
    fields: [modelAdjustments.comparableId],
    references: [comparables.id],
  }),
}));

// Relations for market analysis
export const marketAnalysisRelations = relations(marketAnalysis, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [marketAnalysis.reportId],
    references: [appraisalReports.id],
  }),
}));

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type AppraisalReport = typeof appraisalReports.$inferSelect;
export type InsertAppraisalReport = z.infer<typeof insertAppraisalReportSchema>;

export type Comparable = typeof comparables.$inferSelect;
export type InsertComparable = z.infer<typeof insertComparableSchema>;

export type Adjustment = typeof adjustments.$inferSelect;
export type InsertAdjustment = z.infer<typeof insertAdjustmentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Sketch = typeof sketches.$inferSelect;
export type InsertSketch = z.infer<typeof insertSketchSchema>;

export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

// New types for adjustment models
export type AdjustmentModel = typeof adjustmentModels.$inferSelect;
export type InsertAdjustmentModel = z.infer<typeof insertAdjustmentModelSchema>;

export type ModelAdjustment = typeof modelAdjustments.$inferSelect;
export type InsertModelAdjustment = z.infer<typeof insertModelAdjustmentSchema>;

export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = z.infer<typeof insertMarketAnalysisSchema>;
