import { pgTable, serial, text, integer, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Define the "or" function since we're using it in PropertyShareService
const or = (...conditions: any[]) => ({ type: 'OR', conditions });

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  reports: many(appraisalReports),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  reports: many(appraisalReports),
  shareLinks: many(propertyShareLinks),
}));

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

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Appraisal Report model
export const appraisalReports = pgTable("appraisal_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  reportType: text("report_type").notNull(),
  reportDate: timestamp("report_date").notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  appraisalValue: numeric("appraisal_value"),
  marketValue: numeric("market_value"),
  status: text("status").default("draft"),
  formData: text("form_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  photos: many(photos),
  sketches: many(sketches),
  complianceChecks: many(complianceChecks),
}));

export const insertAppraisalReportSchema = createInsertSchema(appraisalReports).pick({
  userId: true,
  propertyId: true,
  reportType: true,
  reportDate: true,
  effectiveDate: true,
  appraisalValue: true,
  marketValue: true,
  status: true,
  formData: true,
});

export type InsertAppraisalReport = z.infer<typeof insertAppraisalReportSchema>;
export type AppraisalReport = typeof appraisalReports.$inferSelect;

// Comparable model
export const comparables = pgTable("comparables", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  propertyId: integer("property_id").references(() => properties.id),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  proximityToSubject: text("proximity_to_subject"),
  price: numeric("price"),
  saleDate: timestamp("sale_date"),
  propertyType: text("property_type"),
  yearBuilt: integer("year_built"),
  grossLivingArea: numeric("gross_living_area"),
  lotSize: numeric("lot_size"),
  bedrooms: numeric("bedrooms"),
  bathrooms: numeric("bathrooms"),
  basement: text("basement"),
  garage: text("garage"),
  condition: text("condition"),
  quality: text("quality"),
  adjustedPrice: numeric("adjusted_price"),
  netAdjustment: numeric("net_adjustment"),
  grossAdjustment: numeric("gross_adjustment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comparablesRelations = relations(comparables, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [comparables.reportId],
    references: [appraisalReports.id],
  }),
  property: one(properties, {
    fields: [comparables.propertyId],
    references: [properties.id],
  }),
  adjustments: many(adjustments),
  modelAdjustments: many(modelAdjustments),
}));

export const insertComparableSchema = createInsertSchema(comparables).pick({
  reportId: true,
  propertyId: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  proximityToSubject: true,
  price: true,
  saleDate: true,
  propertyType: true,
  yearBuilt: true,
  grossLivingArea: true,
  lotSize: true,
  bedrooms: true,
  bathrooms: true,
  basement: true,
  garage: true,
  condition: true,
  quality: true,
  adjustedPrice: true,
  netAdjustment: true,
  grossAdjustment: true,
});

export type InsertComparable = z.infer<typeof insertComparableSchema>;
export type Comparable = typeof comparables.$inferSelect;

// Adjustment model
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  attributeName: text("attribute_name").notNull(),
  adjustmentValue: numeric("adjustment_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  comparable: one(comparables, {
    fields: [adjustments.comparableId],
    references: [comparables.id],
  }),
  report: one(appraisalReports, {
    fields: [adjustments.reportId],
    references: [appraisalReports.id],
  }),
}));

export const insertAdjustmentSchema = createInsertSchema(adjustments).pick({
  comparableId: true,
  reportId: true,
  attributeName: true,
  adjustmentValue: true,
  description: true,
});

export type InsertAdjustment = z.infer<typeof insertAdjustmentSchema>;
export type Adjustment = typeof adjustments.$inferSelect;

// Photo model
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  photoUrl: text("photo_url").notNull(),
  photoTitle: text("photo_title").notNull(),
  photoDescription: text("photo_description"),
  photoCategory: text("photo_category").default("general"),
  photoOrder: integer("photo_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const photosRelations = relations(photos, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [photos.reportId],
    references: [appraisalReports.id],
  }),
}));

export const insertPhotoSchema = createInsertSchema(photos).pick({
  reportId: true,
  photoUrl: true,
  photoTitle: true,
  photoDescription: true,
  photoCategory: true,
  photoOrder: true,
});

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

// Sketch model
export const sketches = pgTable("sketches", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  sketchUrl: text("sketch_url").notNull(),
  sketchTitle: text("sketch_title").notNull(),
  sketchDescription: text("sketch_description"),
  sketchType: text("sketch_type").default("floor_plan"),
  sketchData: text("sketch_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sketchesRelations = relations(sketches, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [sketches.reportId],
    references: [appraisalReports.id],
  }),
}));

export const insertSketchSchema = createInsertSchema(sketches).pick({
  reportId: true,
  sketchUrl: true,
  sketchTitle: true,
  sketchDescription: true,
  sketchType: true,
  sketchData: true,
});

export type InsertSketch = z.infer<typeof insertSketchSchema>;
export type Sketch = typeof sketches.$inferSelect;

// Compliance Check model
export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  checkType: text("check_type").notNull(),
  checkName: text("check_name").notNull(),
  checkStatus: text("check_status").notNull(),
  checkDescription: text("check_description"),
  checkDetails: text("check_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceChecksRelations = relations(complianceChecks, ({ one }) => ({
  report: one(appraisalReports, {
    fields: [complianceChecks.reportId],
    references: [appraisalReports.id],
  }),
}));

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).pick({
  reportId: true,
  checkType: true,
  checkName: true,
  checkStatus: true,
  checkDescription: true,
  checkDetails: true,
});

export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;
export type ComplianceCheck = typeof complianceChecks.$inferSelect;

// Adjustment Model (for regression-based pricing models)
export const adjustmentModels = pgTable("adjustment_models", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => appraisalReports.id),
  modelName: text("model_name").notNull(),
  modelDescription: text("model_description"),
  modelType: text("model_type").notNull(),
  modelData: text("model_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adjustmentModelsRelations = relations(adjustmentModels, ({ one, many }) => ({
  report: one(appraisalReports, {
    fields: [adjustmentModels.reportId],
    references: [appraisalReports.id],
  }),
  modelAdjustments: many(modelAdjustments),
}));

export const insertAdjustmentModelSchema = createInsertSchema(adjustmentModels).pick({
  reportId: true,
  modelName: true,
  modelDescription: true,
  modelType: true,
  modelData: true,
});

export type InsertAdjustmentModel = z.infer<typeof insertAdjustmentModelSchema>;
export type AdjustmentModel = typeof adjustmentModels.$inferSelect;

// Model Adjustment (adjustments calculated by the model)
export const modelAdjustments = pgTable("model_adjustments", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => adjustmentModels.id),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  attributeName: text("attribute_name").notNull(),
  adjustmentValue: numeric("adjustment_value").notNull(),
  confidence: numeric("confidence"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const insertModelAdjustmentSchema = createInsertSchema(modelAdjustments).pick({
  modelId: true,
  comparableId: true,
  attributeName: true,
  adjustmentValue: true,
  confidence: true,
  description: true,
});

export type InsertModelAdjustment = z.infer<typeof insertModelAdjustmentSchema>;
export type ModelAdjustment = typeof modelAdjustments.$inferSelect;

// File Import Result
export const fileImportResults = pgTable("file_import_results", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  status: text("status").notNull(),
  importedData: text("imported_data"),
  dateImported: timestamp("date_imported").defaultNow(),
  errorMessage: text("error_message"),
});

export const insertFileImportResultSchema = createInsertSchema(fileImportResults).pick({
  id: true,
  userId: true,
  fileName: true,
  fileType: true,
  status: true,
  importedData: true,
  errorMessage: true,
});

export type InsertFileImportResult = z.infer<typeof insertFileImportResultSchema>;
export type FileImportResult = typeof fileImportResults.$inferSelect;
export type FileImportResultUpdate = Partial<InsertFileImportResult>;

// Real Estate Terms for tooltips and glossary
export const realEstateTerms = pgTable("real_estate_terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull().unique(),
  definition: text("definition").notNull(),
  category: text("category"),
  longDescription: text("long_description"),
  example: text("example"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRealEstateTermSchema = createInsertSchema(realEstateTerms).pick({
  term: true,
  definition: true,
  category: true,
  longDescription: true,
  example: true,
  sourceUrl: true,
});

export type InsertRealEstateTerm = z.infer<typeof insertRealEstateTermSchema>;
export type RealEstateTerm = typeof realEstateTerms.$inferSelect;

// Property Share Links
export const propertyShareLinks = pgTable("property_share_links", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  userId: integer("user_id").notNull().references(() => users.id),
  shareToken: text("share_token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  viewsLimit: integer("views_limit"),
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true),
  allowReports: boolean("allow_reports").default(false),
  includePhotos: boolean("include_photos").default(true),
  includeComparables: boolean("include_comparables").default(true),
  includeValuation: boolean("include_valuation").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const propertyShareLinksRelations = relations(propertyShareLinks, ({ one }) => ({
  property: one(properties, {
    fields: [propertyShareLinks.propertyId],
    references: [properties.id],
  }),
  creator: one(users, {
    fields: [propertyShareLinks.userId],
    references: [users.id],
  }),
}));

export const insertPropertyShareLinkSchema = createInsertSchema(propertyShareLinks).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyShareLink = z.infer<typeof insertPropertyShareLinkSchema>;
export type PropertyShareLink = typeof propertyShareLinks.$inferSelect;