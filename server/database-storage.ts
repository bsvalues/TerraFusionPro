import { 
  users, User, InsertUser,
  properties, Property, InsertProperty,
  appraisalReports, AppraisalReport, InsertAppraisalReport,
  comparables, Comparable, InsertComparable,
  adjustments, Adjustment, InsertAdjustment,
  photos, Photo, InsertPhoto,
  sketches, Sketch, InsertSketch,
  complianceChecks, ComplianceCheck, InsertComplianceCheck,
  adjustmentModels, AdjustmentModel, InsertAdjustmentModel,
  modelAdjustments, ModelAdjustment, InsertModelAdjustment,
  marketAnalysis, MarketAnalysis, InsertMarketAnalysis,
  userPreferences, UserPreference, InsertUserPreference,
  adjustmentTemplates, AdjustmentTemplate, InsertAdjustmentTemplate,
  adjustmentRules, AdjustmentRule, InsertAdjustmentRule,
  adjustmentHistory, AdjustmentHistory, InsertAdjustmentHistory,
  collaborationComments, CollaborationComment, InsertCollaborationComment,
  marketData, MarketData, InsertMarketData,
  // Gamification system entities
  achievementDefinitions, AchievementDefinition, InsertAchievementDefinition,
  userAchievements, UserAchievement, InsertUserAchievement,
  levels, Level, InsertLevel,
  userProgress, UserProgress, InsertUserProgress,
  userChallenges, UserChallenge, InsertUserChallenge,
  userNotifications, UserNotification, InsertUserNotification
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, asc, desc, lte, gt, gte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.userId, userId));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [createdProperty] = await db.insert(properties).values(property).returning();
    return createdProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({...property, updatedAt: new Date()})
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      const result = await db.delete(properties).where(eq(properties.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting property:", error);
      return false;
    }
  }

  // Appraisal report operations
  async getAppraisalReport(id: number): Promise<AppraisalReport | undefined> {
    const [report] = await db.select().from(appraisalReports).where(eq(appraisalReports.id, id));
    return report;
  }

  async getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]> {
    return await db.select().from(appraisalReports).where(eq(appraisalReports.userId, userId));
  }

  async getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]> {
    return await db.select().from(appraisalReports).where(eq(appraisalReports.propertyId, propertyId));
  }

  async createAppraisalReport(report: InsertAppraisalReport): Promise<AppraisalReport> {
    const [createdReport] = await db.insert(appraisalReports).values(report).returning();
    return createdReport;
  }

  async updateAppraisalReport(id: number, report: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined> {
    const [updatedReport] = await db
      .update(appraisalReports)
      .set({...report, updatedAt: new Date()})
      .where(eq(appraisalReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteAppraisalReport(id: number): Promise<boolean> {
    try {
      const result = await db.delete(appraisalReports).where(eq(appraisalReports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting appraisal report:", error);
      return false;
    }
  }

  // Comparable operations
  async getComparable(id: number): Promise<Comparable | undefined> {
    const [comparable] = await db.select().from(comparables).where(eq(comparables.id, id));
    return comparable;
  }

  async getComparablesByReport(reportId: number): Promise<Comparable[]> {
    return await db.select().from(comparables).where(eq(comparables.reportId, reportId));
  }

  async createComparable(comparable: InsertComparable): Promise<Comparable> {
    const [createdComparable] = await db.insert(comparables).values(comparable).returning();
    return createdComparable;
  }

  async updateComparable(id: number, comparable: Partial<InsertComparable>): Promise<Comparable | undefined> {
    const [updatedComparable] = await db
      .update(comparables)
      .set({...comparable, updatedAt: new Date()})
      .where(eq(comparables.id, id))
      .returning();
    return updatedComparable;
  }

  async deleteComparable(id: number): Promise<boolean> {
    try {
      await db.delete(comparables).where(eq(comparables.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting comparable:", error);
      return false;
    }
  }

  // Adjustment operations
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    const [adjustment] = await db.select().from(adjustments).where(eq(adjustments.id, id));
    return adjustment;
  }

  async getAdjustmentsByReport(reportId: number): Promise<Adjustment[]> {
    return await db.select().from(adjustments).where(eq(adjustments.reportId, reportId));
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return await db.select().from(adjustments).where(eq(adjustments.comparableId, comparableId));
  }

  async createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment> {
    const [createdAdjustment] = await db.insert(adjustments).values(adjustment).returning();
    return createdAdjustment;
  }

  async updateAdjustment(id: number, adjustment: Partial<InsertAdjustment>): Promise<Adjustment | undefined> {
    const [updatedAdjustment] = await db
      .update(adjustments)
      .set({...adjustment, updatedAt: new Date()})
      .where(eq(adjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    try {
      await db.delete(adjustments).where(eq(adjustments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      return false;
    }
  }

  // Photo operations
  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotosByReport(reportId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.reportId, reportId));
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [createdPhoto] = await db.insert(photos).values(photo).returning();
    return createdPhoto;
  }

  async updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [updatedPhoto] = await db
      .update(photos)
      .set(photo)
      .where(eq(photos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    try {
      await db.delete(photos).where(eq(photos.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting photo:", error);
      return false;
    }
  }

  // Sketch operations
  async getSketch(id: number): Promise<Sketch | undefined> {
    const [sketch] = await db.select().from(sketches).where(eq(sketches.id, id));
    return sketch;
  }

  async getSketchesByReport(reportId: number): Promise<Sketch[]> {
    return await db.select().from(sketches).where(eq(sketches.reportId, reportId));
  }

  async createSketch(sketch: InsertSketch): Promise<Sketch> {
    const [createdSketch] = await db.insert(sketches).values(sketch).returning();
    return createdSketch;
  }

  async updateSketch(id: number, sketch: Partial<InsertSketch>): Promise<Sketch | undefined> {
    const [updatedSketch] = await db
      .update(sketches)
      .set({...sketch, updatedAt: new Date()})
      .where(eq(sketches.id, id))
      .returning();
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    try {
      await db.delete(sketches).where(eq(sketches.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting sketch:", error);
      return false;
    }
  }

  // Compliance operations
  async getComplianceCheck(id: number): Promise<ComplianceCheck | undefined> {
    const [check] = await db.select().from(complianceChecks).where(eq(complianceChecks.id, id));
    return check;
  }

  async getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]> {
    return await db.select().from(complianceChecks).where(eq(complianceChecks.reportId, reportId));
  }

  async createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [createdCheck] = await db.insert(complianceChecks).values(check).returning();
    return createdCheck;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    try {
      await db.delete(complianceChecks).where(eq(complianceChecks.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting compliance check:", error);
      return false;
    }
  }

  // Adjustment Model operations
  async getAdjustmentModel(id: number): Promise<AdjustmentModel | undefined> {
    const [model] = await db.select().from(adjustmentModels).where(eq(adjustmentModels.id, id));
    return model;
  }

  async getAdjustmentModelsByReport(reportId: number): Promise<AdjustmentModel[]> {
    return await db.select().from(adjustmentModels).where(eq(adjustmentModels.reportId, reportId));
  }

  async createAdjustmentModel(model: InsertAdjustmentModel): Promise<AdjustmentModel> {
    const [createdModel] = await db.insert(adjustmentModels).values(model).returning();
    return createdModel;
  }

  async updateAdjustmentModel(id: number, model: Partial<InsertAdjustmentModel>): Promise<AdjustmentModel | undefined> {
    const [updatedModel] = await db
      .update(adjustmentModels)
      .set({...model, updatedAt: new Date()})
      .where(eq(adjustmentModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteAdjustmentModel(id: number): Promise<boolean> {
    try {
      await db.delete(adjustmentModels).where(eq(adjustmentModels.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting adjustment model:", error);
      return false;
    }
  }

  // Model Adjustment operations
  async getModelAdjustment(id: number): Promise<ModelAdjustment | undefined> {
    const [adjustment] = await db.select().from(modelAdjustments).where(eq(modelAdjustments.id, id));
    return adjustment;
  }

  async getModelAdjustmentsByModel(modelId: number): Promise<ModelAdjustment[]> {
    return await db.select().from(modelAdjustments).where(eq(modelAdjustments.modelId, modelId));
  }

  async getModelAdjustmentsByComparable(comparableId: number, modelId?: number): Promise<ModelAdjustment[]> {
    if (modelId) {
      return await db.select().from(modelAdjustments).where(
        and(
          eq(modelAdjustments.comparableId, comparableId),
          eq(modelAdjustments.modelId, modelId)
        )
      );
    }
    return await db.select().from(modelAdjustments).where(eq(modelAdjustments.comparableId, comparableId));
  }

  async createModelAdjustment(adjustment: InsertModelAdjustment): Promise<ModelAdjustment> {
    const [createdAdjustment] = await db.insert(modelAdjustments).values(adjustment).returning();
    return createdAdjustment;
  }

  async updateModelAdjustment(id: number, adjustment: Partial<InsertModelAdjustment>): Promise<ModelAdjustment | undefined> {
    const [updatedAdjustment] = await db
      .update(modelAdjustments)
      .set({...adjustment, updatedAt: new Date()})
      .where(eq(modelAdjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteModelAdjustment(id: number): Promise<boolean> {
    try {
      await db.delete(modelAdjustments).where(eq(modelAdjustments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting model adjustment:", error);
      return false;
    }
  }

  // Market Analysis operations
  async getMarketAnalysis(id: number): Promise<MarketAnalysis | undefined> {
    const [analysis] = await db.select().from(marketAnalysis).where(eq(marketAnalysis.id, id));
    return analysis;
  }

  async getMarketAnalysesByReport(reportId: number): Promise<MarketAnalysis[]> {
    return await db.select().from(marketAnalysis).where(eq(marketAnalysis.reportId, reportId));
  }

  async getMarketAnalysisByType(reportId: number, analysisType: string): Promise<MarketAnalysis | undefined> {
    const [analysis] = await db.select().from(marketAnalysis).where(
      and(
        eq(marketAnalysis.reportId, reportId),
        eq(marketAnalysis.analysisType, analysisType)
      )
    );
    return analysis;
  }

  async createMarketAnalysis(analysis: InsertMarketAnalysis): Promise<MarketAnalysis> {
    const [createdAnalysis] = await db.insert(marketAnalysis).values(analysis).returning();
    return createdAnalysis;
  }

  async updateMarketAnalysis(id: number, analysis: Partial<InsertMarketAnalysis>): Promise<MarketAnalysis | undefined> {
    const [updatedAnalysis] = await db
      .update(marketAnalysis)
      .set({...analysis, updatedAt: new Date()})
      .where(eq(marketAnalysis.id, id))
      .returning();
    return updatedAnalysis;
  }

  async deleteMarketAnalysis(id: number): Promise<boolean> {
    try {
      await db.delete(marketAnalysis).where(eq(marketAnalysis.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting market analysis:", error);
      return false;
    }
  }
  
  // User Preference operations
  async getUserPreference(id: number): Promise<UserPreference | undefined> {
    const [preference] = await db.select().from(userPreferences).where(eq(userPreferences.id, id));
    return preference;
  }

  async getUserPreferencesByUser(userId: number): Promise<UserPreference[]> {
    return await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  }

  async getUserPreferenceByName(userId: number, preferenceName: string): Promise<UserPreference | undefined> {
    const [preference] = await db.select().from(userPreferences).where(
      and(
        eq(userPreferences.userId, userId),
        eq(userPreferences.preferenceName, preferenceName)
      )
    );
    return preference;
  }

  async createUserPreference(preference: InsertUserPreference): Promise<UserPreference> {
    const [createdPreference] = await db.insert(userPreferences).values(preference).returning();
    return createdPreference;
  }

  async updateUserPreference(id: number, preference: Partial<InsertUserPreference>): Promise<UserPreference | undefined> {
    const [updatedPreference] = await db
      .update(userPreferences)
      .set({...preference, updatedAt: new Date()})
      .where(eq(userPreferences.id, id))
      .returning();
    return updatedPreference;
  }

  async deleteUserPreference(id: number): Promise<boolean> {
    try {
      await db.delete(userPreferences).where(eq(userPreferences.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user preference:", error);
      return false;
    }
  }
  
  // Adjustment Template operations
  async getAdjustmentTemplate(id: number): Promise<AdjustmentTemplate | undefined> {
    const [template] = await db.select().from(adjustmentTemplates).where(eq(adjustmentTemplates.id, id));
    return template;
  }

  async getAdjustmentTemplatesByUser(userId: number): Promise<AdjustmentTemplate[]> {
    return await db.select().from(adjustmentTemplates).where(eq(adjustmentTemplates.userId, userId));
  }

  async getPublicAdjustmentTemplates(): Promise<AdjustmentTemplate[]> {
    return await db.select().from(adjustmentTemplates).where(eq(adjustmentTemplates.isPublic, true));
  }

  async getAdjustmentTemplatesByPropertyType(propertyType: string): Promise<AdjustmentTemplate[]> {
    return await db.select().from(adjustmentTemplates).where(eq(adjustmentTemplates.propertyType, propertyType));
  }

  async createAdjustmentTemplate(template: InsertAdjustmentTemplate): Promise<AdjustmentTemplate> {
    const [createdTemplate] = await db.insert(adjustmentTemplates).values(template).returning();
    return createdTemplate;
  }

  async updateAdjustmentTemplate(id: number, template: Partial<InsertAdjustmentTemplate>): Promise<AdjustmentTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(adjustmentTemplates)
      .set({...template, updatedAt: new Date()})
      .where(eq(adjustmentTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteAdjustmentTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(adjustmentTemplates).where(eq(adjustmentTemplates.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting adjustment template:", error);
      return false;
    }
  }
  
  // Adjustment Rule operations
  async getAdjustmentRule(id: number): Promise<AdjustmentRule | undefined> {
    const [rule] = await db.select().from(adjustmentRules).where(eq(adjustmentRules.id, id));
    return rule;
  }

  async getAdjustmentRulesByUser(userId: number): Promise<AdjustmentRule[]> {
    return await db.select().from(adjustmentRules).where(eq(adjustmentRules.userId, userId));
  }

  async getAdjustmentRulesByModel(modelId: number): Promise<AdjustmentRule[]> {
    return await db.select().from(adjustmentRules).where(eq(adjustmentRules.modelId, modelId));
  }

  async getActiveAdjustmentRules(userId: number): Promise<AdjustmentRule[]> {
    return await db.select().from(adjustmentRules).where(
      and(
        eq(adjustmentRules.userId, userId),
        eq(adjustmentRules.isActive, true)
      )
    );
  }

  async createAdjustmentRule(rule: InsertAdjustmentRule): Promise<AdjustmentRule> {
    const [createdRule] = await db.insert(adjustmentRules).values(rule).returning();
    return createdRule;
  }

  async updateAdjustmentRule(id: number, rule: Partial<InsertAdjustmentRule>): Promise<AdjustmentRule | undefined> {
    const [updatedRule] = await db
      .update(adjustmentRules)
      .set({...rule, updatedAt: new Date()})
      .where(eq(adjustmentRules.id, id))
      .returning();
    return updatedRule;
  }

  async deleteAdjustmentRule(id: number): Promise<boolean> {
    try {
      await db.delete(adjustmentRules).where(eq(adjustmentRules.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting adjustment rule:", error);
      return false;
    }
  }
  
  // Adjustment History operations
  async getAdjustmentHistory(id: number): Promise<AdjustmentHistory | undefined> {
    const [history] = await db.select().from(adjustmentHistory).where(eq(adjustmentHistory.id, id));
    return history;
  }

  async getAdjustmentHistoryByUser(userId: number): Promise<AdjustmentHistory[]> {
    return await db.select().from(adjustmentHistory).where(eq(adjustmentHistory.userId, userId));
  }

  async getAdjustmentHistoryByAdjustment(adjustmentId: number): Promise<AdjustmentHistory[]> {
    return await db.select().from(adjustmentHistory).where(eq(adjustmentHistory.adjustmentId, adjustmentId));
  }

  async getAdjustmentHistoryByModelAdjustment(modelAdjustmentId: number): Promise<AdjustmentHistory[]> {
    return await db.select().from(adjustmentHistory).where(eq(adjustmentHistory.modelAdjustmentId, modelAdjustmentId));
  }

  async createAdjustmentHistory(history: InsertAdjustmentHistory): Promise<AdjustmentHistory> {
    const [createdHistory] = await db.insert(adjustmentHistory).values(history).returning();
    return createdHistory;
  }
  
  // Collaboration Comment operations
  async getCollaborationComment(id: number): Promise<CollaborationComment | undefined> {
    const [comment] = await db.select().from(collaborationComments).where(eq(collaborationComments.id, id));
    return comment;
  }

  async getCollaborationCommentsByReport(reportId: number): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.reportId, reportId));
  }

  async getCollaborationCommentsByComparable(comparableId: number): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.comparableId, comparableId));
  }

  async getCollaborationCommentsByAdjustment(adjustmentId: number): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.adjustmentId, adjustmentId));
  }

  async getCollaborationCommentsByModel(modelId: number): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.modelId, modelId));
  }

  async getCollaborationCommentsByModelAdjustment(modelAdjustmentId: number): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.modelAdjustmentId, modelAdjustmentId));
  }

  async getCollaborationCommentsByStatus(status: string): Promise<CollaborationComment[]> {
    return await db.select().from(collaborationComments).where(eq(collaborationComments.status, status));
  }

  async createCollaborationComment(comment: InsertCollaborationComment): Promise<CollaborationComment> {
    const [createdComment] = await db.insert(collaborationComments).values(comment).returning();
    return createdComment;
  }

  async updateCollaborationComment(id: number, comment: Partial<InsertCollaborationComment>): Promise<CollaborationComment | undefined> {
    const [updatedComment] = await db
      .update(collaborationComments)
      .set({...comment, updatedAt: new Date()})
      .where(eq(collaborationComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteCollaborationComment(id: number): Promise<boolean> {
    try {
      await db.delete(collaborationComments).where(eq(collaborationComments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting collaboration comment:", error);
      return false;
    }
  }
  
  // Market Data operations
  async getMarketData(id: number): Promise<MarketData | undefined> {
    const [data] = await db.select().from(marketData).where(eq(marketData.id, id));
    return data;
  }

  async getMarketDataByRegion(region: string): Promise<MarketData[]> {
    return await db.select().from(marketData).where(eq(marketData.region, region));
  }

  async getMarketDataByType(dataType: string): Promise<MarketData[]> {
    return await db.select().from(marketData).where(eq(marketData.dataType, dataType));
  }

  async getMarketDataByRegionAndType(region: string, dataType: string): Promise<MarketData[]> {
    return await db.select().from(marketData).where(
      and(
        eq(marketData.region, region),
        eq(marketData.dataType, dataType)
      )
    );
  }

  async getMarketDataByDateRange(startDate: Date, endDate: Date): Promise<MarketData[]> {
    return await db.select().from(marketData).where(
      and(
        // @ts-ignore - datePoint is a date column even though TypeScript thinks it's not
        db.sql`${marketData.datePoint} >= ${startDate}`,
        // @ts-ignore
        db.sql`${marketData.datePoint} <= ${endDate}`
      )
    );
  }

  async createMarketData(data: InsertMarketData): Promise<MarketData> {
    const [createdData] = await db.insert(marketData).values(data).returning();
    return createdData;
  }

  async deleteMarketData(id: number): Promise<boolean> {
    try {
      await db.delete(marketData).where(eq(marketData.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting market data:", error);
      return false;
    }
  }

  // Gamification System: Achievement Definitions

  async getAchievementDefinition(id: number): Promise<AchievementDefinition | undefined> {
    try {
      const [achievementDefinition] = await db
        .select()
        .from(achievementDefinitions)
        .where(eq(achievementDefinitions.id, id));
      return achievementDefinition;
    } catch (error) {
      console.error("Error getting achievement definition:", error);
      return undefined;
    }
  }

  async getAchievementDefinitionsByCategory(category: string): Promise<AchievementDefinition[]> {
    try {
      return await db
        .select()
        .from(achievementDefinitions)
        .where(eq(achievementDefinitions.category, category));
    } catch (error) {
      console.error("Error getting achievement definitions by category:", error);
      return [];
    }
  }

  async getAchievementDefinitionsByType(type: string): Promise<AchievementDefinition[]> {
    try {
      return await db
        .select()
        .from(achievementDefinitions)
        .where(eq(achievementDefinitions.type, type));
    } catch (error) {
      console.error("Error getting achievement definitions by type:", error);
      return [];
    }
  }

  async getAllAchievementDefinitions(): Promise<AchievementDefinition[]> {
    try {
      return await db.select().from(achievementDefinitions);
    } catch (error) {
      console.error("Error getting all achievement definitions:", error);
      return [];
    }
  }

  async createAchievementDefinition(definition: InsertAchievementDefinition): Promise<AchievementDefinition> {
    try {
      const [newDefinition] = await db
        .insert(achievementDefinitions)
        .values(definition)
        .returning();
      return newDefinition;
    } catch (error) {
      console.error("Error creating achievement definition:", error);
      throw error;
    }
  }

  async updateAchievementDefinition(id: number, definition: Partial<InsertAchievementDefinition>): Promise<AchievementDefinition | undefined> {
    try {
      const [updatedDefinition] = await db
        .update(achievementDefinitions)
        .set({ ...definition, updatedAt: new Date() })
        .where(eq(achievementDefinitions.id, id))
        .returning();
      return updatedDefinition;
    } catch (error) {
      console.error("Error updating achievement definition:", error);
      return undefined;
    }
  }

  async deleteAchievementDefinition(id: number): Promise<boolean> {
    try {
      await db.delete(achievementDefinitions).where(eq(achievementDefinitions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting achievement definition:", error);
      return false;
    }
  }

  // Gamification System: User Achievements

  async getUserAchievement(id: number): Promise<UserAchievement | undefined> {
    try {
      const [userAchievement] = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.id, id));
      return userAchievement;
    } catch (error) {
      console.error("Error getting user achievement:", error);
      return undefined;
    }
  }

  async getUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    try {
      return await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));
    } catch (error) {
      console.error("Error getting user achievements by user:", error);
      return [];
    }
  }

  async getUserAchievementByAchievementAndUser(achievementId: number, userId: number): Promise<UserAchievement | undefined> {
    try {
      const [userAchievement] = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.achievementId, achievementId))
        .where(eq(userAchievements.userId, userId));
      return userAchievement;
    } catch (error) {
      console.error("Error getting user achievement by achievement and user:", error);
      return undefined;
    }
  }

  async getUserAchievementsByStatus(status: string, userId?: number): Promise<UserAchievement[]> {
    try {
      if (userId) {
        return await db
          .select()
          .from(userAchievements)
          .where(eq(userAchievements.status, status))
          .where(eq(userAchievements.userId, userId));
      } else {
        return await db
          .select()
          .from(userAchievements)
          .where(eq(userAchievements.status, status));
      }
    } catch (error) {
      console.error("Error getting user achievements by status:", error);
      return [];
    }
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    try {
      const [newAchievement] = await db
        .insert(userAchievements)
        .values(achievement)
        .returning();
      return newAchievement;
    } catch (error) {
      console.error("Error creating user achievement:", error);
      throw error;
    }
  }

  async updateUserAchievement(id: number, achievement: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined> {
    try {
      const [updatedAchievement] = await db
        .update(userAchievements)
        .set(achievement)
        .where(eq(userAchievements.id, id))
        .returning();
      return updatedAchievement;
    } catch (error) {
      console.error("Error updating user achievement:", error);
      return undefined;
    }
  }

  async deleteUserAchievement(id: number): Promise<boolean> {
    try {
      await db.delete(userAchievements).where(eq(userAchievements.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user achievement:", error);
      return false;
    }
  }

  // Gamification System: Levels

  async getLevel(id: number): Promise<Level | undefined> {
    try {
      const [level] = await db
        .select()
        .from(levels)
        .where(eq(levels.id, id));
      return level;
    } catch (error) {
      console.error("Error getting level:", error);
      return undefined;
    }
  }

  async getLevelByPointThreshold(points: number): Promise<Level | undefined> {
    try {
      // Get the highest level where the point threshold is less than or equal to the user's points
      const [level] = await db
        .select()
        .from(levels)
        .where(lte(levels.pointThreshold, points))
        .orderBy(desc(levels.pointThreshold))
        .limit(1);
      return level;
    } catch (error) {
      console.error("Error getting level by point threshold:", error);
      return undefined;
    }
  }

  async getNextLevel(currentLevelId: number): Promise<Level | undefined> {
    try {
      const [currentLevel] = await db
        .select()
        .from(levels)
        .where(eq(levels.id, currentLevelId));
      
      if (!currentLevel) return undefined;
      
      // Get the level with the lowest point threshold that is higher than the current level
      const [nextLevel] = await db
        .select()
        .from(levels)
        .where(gt(levels.pointThreshold, currentLevel.pointThreshold))
        .orderBy(asc(levels.pointThreshold))
        .limit(1);
      
      return nextLevel;
    } catch (error) {
      console.error("Error getting next level:", error);
      return undefined;
    }
  }

  async getAllLevels(): Promise<Level[]> {
    try {
      return await db
        .select()
        .from(levels)
        .orderBy(asc(levels.pointThreshold));
    } catch (error) {
      console.error("Error getting all levels:", error);
      return [];
    }
  }

  async createLevel(level: InsertLevel): Promise<Level> {
    try {
      const [newLevel] = await db
        .insert(levels)
        .values(level)
        .returning();
      return newLevel;
    } catch (error) {
      console.error("Error creating level:", error);
      throw error;
    }
  }

  async updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level | undefined> {
    try {
      const [updatedLevel] = await db
        .update(levels)
        .set({ ...level, updatedAt: new Date() })
        .where(eq(levels.id, id))
        .returning();
      return updatedLevel;
    } catch (error) {
      console.error("Error updating level:", error);
      return undefined;
    }
  }

  async deleteLevel(id: number): Promise<boolean> {
    try {
      await db.delete(levels).where(eq(levels.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting level:", error);
      return false;
    }
  }

  // Gamification System: User Progress

  async getUserProgress(id: number): Promise<UserProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.id, id));
      return progress;
    } catch (error) {
      console.error("Error getting user progress:", error);
      return undefined;
    }
  }

  async getUserProgressByUser(userId: number): Promise<UserProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      return progress;
    } catch (error) {
      console.error("Error getting user progress by user:", error);
      return undefined;
    }
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    try {
      const [newProgress] = await db
        .insert(userProgress)
        .values(progress)
        .returning();
      return newProgress;
    } catch (error) {
      console.error("Error creating user progress:", error);
      throw error;
    }
  }

  async updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    try {
      const [updatedProgress] = await db
        .update(userProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(userProgress.id, id))
        .returning();
      return updatedProgress;
    } catch (error) {
      console.error("Error updating user progress:", error);
      return undefined;
    }
  }

  async addPointsToUserProgress(userId: number, points: number): Promise<UserProgress | undefined> {
    try {
      let userProgressRecord = await this.getUserProgressByUser(userId);
      
      if (!userProgressRecord) {
        // Create a new progress record if none exists
        userProgressRecord = await this.createUserProgress({
          userId,
          totalPoints: points,
        });
      } else {
        // Update existing record
        const totalPoints = userProgressRecord.totalPoints + points;
        
        // Check if user needs to level up
        const nextLevel = await this.getLevelByPointThreshold(totalPoints);
        
        if (nextLevel && (!userProgressRecord.currentLevel || nextLevel.id !== userProgressRecord.currentLevel)) {
          // User has leveled up
          const futureLevel = await this.getNextLevel(nextLevel.id);
          
          userProgressRecord = await this.updateUserProgress(userProgressRecord.id, {
            totalPoints,
            currentLevel: nextLevel.id,
            nextLevel: futureLevel?.id,
            pointsToNextLevel: futureLevel ? futureLevel.pointThreshold - totalPoints : 0,
          });
        } else {
          // Just update points
          const currentLevel = userProgressRecord.currentLevel 
            ? await this.getLevel(userProgressRecord.currentLevel)
            : await this.getLevelByPointThreshold(totalPoints);
          
          const futureLevel = currentLevel
            ? await this.getNextLevel(currentLevel.id)
            : undefined;
          
          userProgressRecord = await this.updateUserProgress(userProgressRecord.id, {
            totalPoints,
            currentLevel: currentLevel?.id,
            nextLevel: futureLevel?.id,
            pointsToNextLevel: futureLevel ? futureLevel.pointThreshold - totalPoints : 0,
          });
        }
      }
      
      return userProgressRecord;
    } catch (error) {
      console.error("Error adding points to user progress:", error);
      return undefined;
    }
  }

  async updateStreakDays(userId: number): Promise<UserProgress | undefined> {
    try {
      const userProgressRecord = await this.getUserProgressByUser(userId);
      
      if (!userProgressRecord) {
        return undefined;
      }
      
      const lastActive = new Date(userProgressRecord.lastActive);
      const today = new Date();
      
      // Check if last active was yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isYesterday = lastActive.getDate() === yesterday.getDate() &&
                          lastActive.getMonth() === yesterday.getMonth() &&
                          lastActive.getFullYear() === yesterday.getFullYear();
      
      // Check if last active was today already
      const isToday = lastActive.getDate() === today.getDate() &&
                      lastActive.getMonth() === today.getMonth() &&
                      lastActive.getFullYear() === today.getFullYear();
      
      let streakDays = userProgressRecord.streakDays;
      
      if (isYesterday) {
        // Continue streak
        streakDays += 1;
      } else if (isToday) {
        // Already logged in today, no change to streak
      } else {
        // Reset streak
        streakDays = 1;
      }
      
      const updatedProgress = await this.updateUserProgress(userProgressRecord.id, {
        streakDays,
        lastActive: today,
      });
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating streak days:", error);
      return undefined;
    }
  }

  async incrementUserProgressStats(userId: number, field: 'completedAchievements' | 'completedReports' | 'completedAdjustments', incrementBy: number = 1): Promise<UserProgress | undefined> {
    try {
      let userProgressRecord = await this.getUserProgressByUser(userId);
      
      if (!userProgressRecord) {
        // Create a new progress record if none exists with the incremented stat
        const initialData = {
          userId,
          [field]: incrementBy,
        };
        userProgressRecord = await this.createUserProgress(initialData as InsertUserProgress);
      } else {
        // Update existing record
        const currentValue = userProgressRecord[field] || 0;
        const updateData = {
          [field]: currentValue + incrementBy,
        };
        userProgressRecord = await this.updateUserProgress(userProgressRecord.id, updateData as Partial<InsertUserProgress>);
      }
      
      return userProgressRecord;
    } catch (error) {
      console.error(`Error incrementing ${field}:`, error);
      return undefined;
    }
  }

  // Gamification System: User Challenges

  async getUserChallenge(id: number): Promise<UserChallenge | undefined> {
    try {
      const [challenge] = await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.id, id));
      return challenge;
    } catch (error) {
      console.error("Error getting user challenge:", error);
      return undefined;
    }
  }

  async getUserChallengesByUser(userId: number): Promise<UserChallenge[]> {
    try {
      return await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.userId, userId));
    } catch (error) {
      console.error("Error getting user challenges by user:", error);
      return [];
    }
  }

  async getActiveChallengesByUser(userId: number): Promise<UserChallenge[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(userChallenges)
        .where(eq(userChallenges.userId, userId))
        .where(eq(userChallenges.status, "active"))
        .where(lte(userChallenges.startDate, now))
        .where(gte(userChallenges.endDate, now));
    } catch (error) {
      console.error("Error getting active challenges by user:", error);
      return [];
    }
  }

  async getUserChallengesByType(type: string, userId?: number): Promise<UserChallenge[]> {
    try {
      if (userId) {
        return await db
          .select()
          .from(userChallenges)
          .where(eq(userChallenges.type, type))
          .where(eq(userChallenges.userId, userId));
      } else {
        return await db
          .select()
          .from(userChallenges)
          .where(eq(userChallenges.type, type));
      }
    } catch (error) {
      console.error("Error getting user challenges by type:", error);
      return [];
    }
  }

  async createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge> {
    try {
      const [newChallenge] = await db
        .insert(userChallenges)
        .values(challenge)
        .returning();
      return newChallenge;
    } catch (error) {
      console.error("Error creating user challenge:", error);
      throw error;
    }
  }

  async updateUserChallenge(id: number, challenge: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined> {
    try {
      const [updatedChallenge] = await db
        .update(userChallenges)
        .set({ ...challenge, updatedAt: new Date() })
        .where(eq(userChallenges.id, id))
        .returning();
      return updatedChallenge;
    } catch (error) {
      console.error("Error updating user challenge:", error);
      return undefined;
    }
  }

  async incrementChallengeProgress(id: number, incrementBy: number = 1): Promise<UserChallenge | undefined> {
    try {
      const challenge = await this.getUserChallenge(id);
      
      if (!challenge) {
        return undefined;
      }
      
      const newProgress = challenge.progress + incrementBy;
      let updatedStatus = challenge.status;
      
      // Check if challenge is now completed
      if (newProgress >= challenge.goal && challenge.status === "active") {
        updatedStatus = "completed";
      }
      
      const updatedChallenge = await this.updateUserChallenge(id, {
        progress: newProgress,
        status: updatedStatus,
      });
      
      return updatedChallenge;
    } catch (error) {
      console.error("Error incrementing challenge progress:", error);
      return undefined;
    }
  }

  async deleteUserChallenge(id: number): Promise<boolean> {
    try {
      await db.delete(userChallenges).where(eq(userChallenges.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user challenge:", error);
      return false;
    }
  }

  // Gamification System: User Notifications

  async getUserNotification(id: number): Promise<UserNotification | undefined> {
    try {
      const [notification] = await db
        .select()
        .from(userNotifications)
        .where(eq(userNotifications.id, id));
      return notification;
    } catch (error) {
      console.error("Error getting user notification:", error);
      return undefined;
    }
  }

  async getUserNotificationsByUser(userId: number): Promise<UserNotification[]> {
    try {
      return await db
        .select()
        .from(userNotifications)
        .where(eq(userNotifications.userId, userId))
        .orderBy(desc(userNotifications.createdAt));
    } catch (error) {
      console.error("Error getting user notifications by user:", error);
      return [];
    }
  }

  async getUnreadNotificationsByUser(userId: number): Promise<UserNotification[]> {
    try {
      return await db
        .select()
        .from(userNotifications)
        .where(eq(userNotifications.userId, userId))
        .where(eq(userNotifications.read, false))
        .orderBy(desc(userNotifications.createdAt));
    } catch (error) {
      console.error("Error getting unread notifications by user:", error);
      return [];
    }
  }

  async getUserNotificationsByType(type: string, userId?: number): Promise<UserNotification[]> {
    try {
      if (userId) {
        return await db
          .select()
          .from(userNotifications)
          .where(eq(userNotifications.type, type))
          .where(eq(userNotifications.userId, userId))
          .orderBy(desc(userNotifications.createdAt));
      } else {
        return await db
          .select()
          .from(userNotifications)
          .where(eq(userNotifications.type, type))
          .orderBy(desc(userNotifications.createdAt));
      }
    } catch (error) {
      console.error("Error getting user notifications by type:", error);
      return [];
    }
  }

  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    try {
      const [newNotification] = await db
        .insert(userNotifications)
        .values(notification)
        .returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating user notification:", error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<UserNotification | undefined> {
    try {
      const [updatedNotification] = await db
        .update(userNotifications)
        .set({ read: true })
        .where(eq(userNotifications.id, id))
        .returning();
      return updatedNotification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return undefined;
    }
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(userNotifications)
        .set({ read: true })
        .where(eq(userNotifications.userId, userId))
        .where(eq(userNotifications.read, false));
      return true;
    } catch (error) {
      console.error("Error marking all user notifications as read:", error);
      return false;
    }
  }

  async deleteUserNotification(id: number): Promise<boolean> {
    try {
      await db.delete(userNotifications).where(eq(userNotifications.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user notification:", error);
      return false;
    }
  }
}