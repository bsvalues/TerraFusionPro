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
  // (Gamification entities are imported below)
  // Order entities
  orders, Order, InsertOrder,
  // Terminology entities
  realEstateTerms, RealEstateTerm, InsertRealEstateTerm,
  // Field Notes entities
  fieldNotes, 
  // Gamification system entities
  achievementDefinitions, AchievementDefinition, InsertAchievementDefinition,
  userAchievements, UserAchievement, InsertUserAchievement,
  levels, Level, InsertLevel,
  userProgress, UserProgress, InsertUserProgress,
  userChallenges, UserChallenge, InsertUserChallenge,
  // Reviewer UX entities
  reviewRequests, ReviewRequest, InsertReviewRequest,
  comments, Comment, InsertComment,
  annotations, Annotation, InsertAnnotation,
  revisionHistory, RevisionHistory, InsertRevisionHistory,
  // Enhanced Notification entities
  userNotifications, UserNotification, InsertUserNotification,
  // File import system
  fileImportResults, FileImportResult, InsertFileImportResult
} from "@shared/schema";

// Extend the storage interface to support all our models
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Appraisal report operations
  getAppraisalReport(id: number): Promise<AppraisalReport | undefined>;
  getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]>;
  getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]>;
  createAppraisalReport(report: InsertAppraisalReport): Promise<AppraisalReport>;
  updateAppraisalReport(id: number, report: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined>;
  deleteAppraisalReport(id: number): Promise<boolean>;

  // Comparable operations
  getComparable(id: number): Promise<Comparable | undefined>;
  getComparablesByReport(reportId: number): Promise<Comparable[]>;
  createComparable(comparable: InsertComparable): Promise<Comparable>;
  updateComparable(id: number, comparable: Partial<InsertComparable>): Promise<Comparable | undefined>;
  deleteComparable(id: number): Promise<boolean>;

  // Adjustment operations
  getAdjustment(id: number): Promise<Adjustment | undefined>;
  getAdjustmentsByReport(reportId: number): Promise<Adjustment[]>;
  getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]>;
  createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment>;
  updateAdjustment(id: number, adjustment: Partial<InsertAdjustment>): Promise<Adjustment | undefined>;
  deleteAdjustment(id: number): Promise<boolean>;

  // Photo operations
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByReport(reportId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

  // Sketch operations
  getSketch(id: number): Promise<Sketch | undefined>;
  getSketchesByReport(reportId: number): Promise<Sketch[]>;
  createSketch(sketch: InsertSketch): Promise<Sketch>;
  updateSketch(id: number, sketch: Partial<InsertSketch>): Promise<Sketch | undefined>;
  deleteSketch(id: number): Promise<boolean>;

  // Compliance operations
  getComplianceCheck(id: number): Promise<ComplianceCheck | undefined>;
  getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]>;
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  deleteComplianceCheck(id: number): Promise<boolean>;
  
  // File import operations
  createFileImportResult(result: InsertFileImportResult): Promise<FileImportResult>;
  getFileImportResult(id: string): Promise<FileImportResult | undefined>;
  getFileImportResults(limit?: number, offset?: number): Promise<FileImportResult[]>;
  
  // Adjustment Model operations
  getAdjustmentModel(id: number): Promise<AdjustmentModel | undefined>;
  getAdjustmentModelsByReport(reportId: number): Promise<AdjustmentModel[]>;
  createAdjustmentModel(model: InsertAdjustmentModel): Promise<AdjustmentModel>;
  updateAdjustmentModel(id: number, model: Partial<InsertAdjustmentModel>): Promise<AdjustmentModel | undefined>;
  deleteAdjustmentModel(id: number): Promise<boolean>;
  
  // Model Adjustment operations
  getModelAdjustment(id: number): Promise<ModelAdjustment | undefined>;
  getModelAdjustmentsByModel(modelId: number): Promise<ModelAdjustment[]>;
  getModelAdjustmentsByComparable(comparableId: number, modelId?: number): Promise<ModelAdjustment[]>;
  createModelAdjustment(adjustment: InsertModelAdjustment): Promise<ModelAdjustment>;
  updateModelAdjustment(id: number, adjustment: Partial<InsertModelAdjustment>): Promise<ModelAdjustment | undefined>;
  deleteModelAdjustment(id: number): Promise<boolean>;
  
  // Market Analysis operations
  getMarketAnalysis(id: number): Promise<MarketAnalysis | undefined>;
  getMarketAnalysesByReport(reportId: number): Promise<MarketAnalysis[]>;
  getMarketAnalysisByType(reportId: number, analysisType: string): Promise<MarketAnalysis | undefined>;
  createMarketAnalysis(analysis: InsertMarketAnalysis): Promise<MarketAnalysis>;
  updateMarketAnalysis(id: number, analysis: Partial<InsertMarketAnalysis>): Promise<MarketAnalysis | undefined>;
  deleteMarketAnalysis(id: number): Promise<boolean>;
  
  // User Preference operations
  getUserPreference(id: number): Promise<UserPreference | undefined>;
  getUserPreferencesByUser(userId: number): Promise<UserPreference[]>;
  getUserPreferenceByName(userId: number, preferenceName: string): Promise<UserPreference | undefined>;
  createUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(id: number, preference: Partial<InsertUserPreference>): Promise<UserPreference | undefined>;
  deleteUserPreference(id: number): Promise<boolean>;
  
  // Adjustment Template operations
  getAdjustmentTemplate(id: number): Promise<AdjustmentTemplate | undefined>;
  getAdjustmentTemplatesByUser(userId: number): Promise<AdjustmentTemplate[]>;
  getPublicAdjustmentTemplates(): Promise<AdjustmentTemplate[]>;
  getAdjustmentTemplatesByPropertyType(propertyType: string): Promise<AdjustmentTemplate[]>;
  createAdjustmentTemplate(template: InsertAdjustmentTemplate): Promise<AdjustmentTemplate>;
  updateAdjustmentTemplate(id: number, template: Partial<InsertAdjustmentTemplate>): Promise<AdjustmentTemplate | undefined>;
  deleteAdjustmentTemplate(id: number): Promise<boolean>;
  
  // Adjustment Rule operations
  getAdjustmentRule(id: number): Promise<AdjustmentRule | undefined>;
  getAdjustmentRulesByUser(userId: number): Promise<AdjustmentRule[]>;
  getAdjustmentRulesByModel(modelId: number): Promise<AdjustmentRule[]>;
  getActiveAdjustmentRules(userId: number): Promise<AdjustmentRule[]>;
  createAdjustmentRule(rule: InsertAdjustmentRule): Promise<AdjustmentRule>;
  updateAdjustmentRule(id: number, rule: Partial<InsertAdjustmentRule>): Promise<AdjustmentRule | undefined>;
  deleteAdjustmentRule(id: number): Promise<boolean>;
  
  // Adjustment History operations
  getAdjustmentHistory(id: number): Promise<AdjustmentHistory | undefined>;
  getAdjustmentHistoryByUser(userId: number): Promise<AdjustmentHistory[]>;
  getAdjustmentHistoryByAdjustment(adjustmentId: number): Promise<AdjustmentHistory[]>;
  getAdjustmentHistoryByModelAdjustment(modelAdjustmentId: number): Promise<AdjustmentHistory[]>;
  createAdjustmentHistory(history: InsertAdjustmentHistory): Promise<AdjustmentHistory>;
  
  // Collaboration Comment operations
  getCollaborationComment(id: number): Promise<CollaborationComment | undefined>;
  getCollaborationCommentsByReport(reportId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByComparable(comparableId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByAdjustment(adjustmentId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByModel(modelId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByModelAdjustment(modelAdjustmentId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByStatus(status: string): Promise<CollaborationComment[]>;
  createCollaborationComment(comment: InsertCollaborationComment): Promise<CollaborationComment>;
  updateCollaborationComment(id: number, comment: Partial<InsertCollaborationComment>): Promise<CollaborationComment | undefined>;
  deleteCollaborationComment(id: number): Promise<boolean>;
  
  // Market Data operations
  getMarketData(id: number): Promise<MarketData | undefined>;
  getMarketDataByRegion(region: string): Promise<MarketData[]>;
  getMarketDataByType(dataType: string): Promise<MarketData[]>;
  getMarketDataByRegionAndType(region: string, dataType: string): Promise<MarketData[]>;
  getMarketDataByDateRange(startDate: Date, endDate: Date): Promise<MarketData[]>;
  createMarketData(data: InsertMarketData): Promise<MarketData>;
  deleteMarketData(id: number): Promise<boolean>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByProperty(propertyId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByType(type: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Achievement Definition operations
  getAchievementDefinition(id: number): Promise<AchievementDefinition | undefined>;
  getAchievementDefinitionsByCategory(category: string): Promise<AchievementDefinition[]>;
  getAchievementDefinitionsByType(type: string): Promise<AchievementDefinition[]>;
  getAllAchievementDefinitions(): Promise<AchievementDefinition[]>;
  createAchievementDefinition(definition: InsertAchievementDefinition): Promise<AchievementDefinition>;
  updateAchievementDefinition(id: number, definition: Partial<InsertAchievementDefinition>): Promise<AchievementDefinition | undefined>;
  deleteAchievementDefinition(id: number): Promise<boolean>;
  
  // User Achievement operations
  getUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;
  getUserAchievementByAchievementAndUser(achievementId: number, userId: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByStatus(status: string, userId?: number): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: number, achievement: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined>;
  deleteUserAchievement(id: number): Promise<boolean>;
  
  // Level operations
  getLevel(id: number): Promise<Level | undefined>;
  getLevelByPointThreshold(points: number): Promise<Level | undefined>;
  getNextLevel(currentLevelId: number): Promise<Level | undefined>;
  getAllLevels(): Promise<Level[]>;
  createLevel(level: InsertLevel): Promise<Level>;
  updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level | undefined>;
  deleteLevel(id: number): Promise<boolean>;
  
  // User Progress operations
  getUserProgress(id: number): Promise<UserProgress | undefined>;
  getUserProgressByUser(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  addPointsToUserProgress(userId: number, points: number): Promise<UserProgress | undefined>;
  updateStreakDays(userId: number): Promise<UserProgress | undefined>;
  incrementUserProgressStats(userId: number, field: 'completedAchievements' | 'completedReports' | 'completedAdjustments', incrementBy?: number): Promise<UserProgress | undefined>;
  
  // User Challenge operations
  getUserChallenge(id: number): Promise<UserChallenge | undefined>;
  getUserChallengesByUser(userId: number): Promise<UserChallenge[]>;
  getActiveChallengesByUser(userId: number): Promise<UserChallenge[]>;
  getUserChallengesByType(type: string, userId?: number): Promise<UserChallenge[]>;
  createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(id: number, challenge: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined>;
  incrementChallengeProgress(id: number, incrementBy?: number): Promise<UserChallenge | undefined>;
  deleteUserChallenge(id: number): Promise<boolean>;
  
  // Review Request operations
  getReviewRequest(id: number): Promise<ReviewRequest | undefined>;
  getReviewRequestsByObject(objectType: string, objectId: number): Promise<ReviewRequest[]>;
  getReviewRequestsByRequestor(userId: number): Promise<ReviewRequest[]>;
  getReviewRequestsByAssignee(userId: number): Promise<ReviewRequest[]>;
  getReviewRequestsByStatus(status: string): Promise<ReviewRequest[]>;
  createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest>;
  updateReviewRequest(id: number, request: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined>;
  updateReviewRequestStatus(id: number, status: string): Promise<ReviewRequest | undefined>;
  deleteReviewRequest(id: number): Promise<boolean>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]>;
  getCommentsByUser(userId: number): Promise<Comment[]>;
  getCommentsByParent(parentId: number): Promise<Comment[]>;
  getCommentsByType(commentType: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  resolveComment(id: number, resolved: boolean): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Annotation operations
  getAnnotation(id: number): Promise<Annotation | undefined>;
  getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]>;
  getAnnotationsByUser(userId: number): Promise<Annotation[]>;
  getAnnotationsByType(annotationType: string): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;
  
  // Revision History operations
  getRevisionHistory(id: number): Promise<RevisionHistory | undefined>;
  getRevisionHistoryByObject(objectType: string, objectId: number): Promise<RevisionHistory[]>;
  getRevisionHistoryByUser(userId: number): Promise<RevisionHistory[]>;
  createRevisionHistory(revision: InsertRevisionHistory): Promise<RevisionHistory>;
  
  // Enhanced User Notification operations
  getUserNotification(id: number): Promise<UserNotification | undefined>;
  getUserNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUserNotificationsByType(type: string, userId?: number): Promise<UserNotification[]>;
  getUserNotificationsByObject(objectType: string, objectId: number, userId?: number): Promise<UserNotification[]>;
  getUserNotificationsBySourceUser(sourceUserId: number): Promise<UserNotification[]>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markNotificationAsRead(id: number): Promise<UserNotification | undefined>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;
  deleteUserNotification(id: number): Promise<boolean>;
  
  // File Import operations
  getFileImportResult(id: string): Promise<FileImportResult | undefined>;
  getFileImportResults(): Promise<FileImportResult[]>;
  getFileImportResultsByStatus(status: string): Promise<FileImportResult[]>;
  createFileImportResult(result: InsertFileImportResult): Promise<FileImportResult>;
  updateFileImportResult(id: string, result: Partial<InsertFileImportResult>): Promise<FileImportResult | undefined>;
  deleteFileImportResult(id: string): Promise<boolean>;
  
  // Property search operations for imports
  getPropertiesByAddress(address: string, city: string, state: string): Promise<Property[]>;
  saveImportResult(result: InsertFileImportResult): Promise<FileImportResult>;
  
  // Real Estate Term operations
  getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined>;
  getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined>;
  getAllRealEstateTerms(): Promise<RealEstateTerm[]>;
  getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]>;
  getTermsByNames(termNames: string[]): Promise<RealEstateTerm[]>;
  createRealEstateTerm(term: InsertRealEstateTerm): Promise<RealEstateTerm>;
  updateRealEstateTerm(id: number, term: Partial<InsertRealEstateTerm>): Promise<RealEstateTerm | undefined>;
  deleteRealEstateTerm(id: number): Promise<boolean>;
  
  // Reviewer UX operations - Review Requests
  getReviewRequest(id: number): Promise<ReviewRequest | undefined>;
  getReviewRequestsByObject(objectType: string, objectId: number): Promise<ReviewRequest[]>;
  getReviewRequestsByRequester(requesterId: number): Promise<ReviewRequest[]>;
  getReviewRequestsByReviewer(reviewerId: number): Promise<ReviewRequest[]>;
  getPendingReviewRequests(): Promise<ReviewRequest[]>;
  getReviewRequestsByStatus(status: string): Promise<ReviewRequest[]>;
  createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest>;
  updateReviewRequest(id: number, updateData: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined>;
  completeReviewRequest(id: number, approved: boolean): Promise<ReviewRequest | undefined>;
  deleteReviewRequest(id: number): Promise<boolean>;
  
  // Reviewer UX operations - Comments
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]>;
  getCommentsByUser(userId: number): Promise<Comment[]>;
  getCommentsByThread(threadId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Reviewer UX operations - Annotations
  getAnnotation(id: number): Promise<Annotation | undefined>;
  getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]>;
  getAnnotationsByUser(userId: number): Promise<Annotation[]>;
  getAnnotationsByType(annotationType: string): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;
  
  // Reviewer UX operations - Revision History
  getRevisionHistory(id: number): Promise<RevisionHistory | undefined>;
  getRevisionHistoryByObject(objectType: string, objectId: number): Promise<RevisionHistory[]>;
  getRevisionHistoryByUser(userId: number): Promise<RevisionHistory[]>;
  createRevisionHistory(revision: InsertRevisionHistory): Promise<RevisionHistory>;
  
  // Gamification operations - Achievement Definitions
  getAchievementDefinition(id: number): Promise<AchievementDefinition | undefined>;
  getAllAchievementDefinitions(): Promise<AchievementDefinition[]>;
  getAchievementDefinitionsByType(type: string): Promise<AchievementDefinition[]>;
  createAchievementDefinition(insertDef: InsertAchievementDefinition): Promise<AchievementDefinition>;
  updateAchievementDefinition(id: number, updateData: Partial<InsertAchievementDefinition>): Promise<AchievementDefinition | undefined>;
  deleteAchievementDefinition(id: number): Promise<boolean>;
  
  // Gamification operations - User Achievements
  getUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;
  getUserAchievementByUserAndDefinition(userId: number, definitionId: number): Promise<UserAchievement | undefined>;
  createUserAchievement(insertAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: number, updateData: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined>;
  completeUserAchievement(id: number): Promise<UserAchievement | undefined>;
  deleteUserAchievement(id: number): Promise<boolean>;
  
  // Gamification operations - Levels
  getLevel(id: number): Promise<Level | undefined>;
  getLevelByNumber(levelNumber: number): Promise<Level | undefined>;
  getAllLevels(): Promise<Level[]>;
  createLevel(insertLevel: InsertLevel): Promise<Level>;
  updateLevel(id: number, updateData: Partial<InsertLevel>): Promise<Level | undefined>;
  deleteLevel(id: number): Promise<boolean>;
  
  // Gamification operations - User Progress
  getUserProgress(id: number): Promise<UserProgress | undefined>;
  getUserProgressByUser(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, updateData: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  incrementPropertyEvaluations(userId: number): Promise<UserProgress | undefined>;
  incrementUserStreak(userId: number): Promise<UserProgress | undefined>;
  resetUserStreak(userId: number): Promise<UserProgress | undefined>;
  levelUpUser(userId: number): Promise<UserProgress | undefined>;
  deleteUserProgress(id: number): Promise<boolean>;
  
  // Gamification operations - User Challenges
  getUserChallenge(id: number): Promise<UserChallenge | undefined>;
  getUserChallengesByUser(userId: number): Promise<UserChallenge[]>;
  getActiveUserChallengesByUser(userId: number): Promise<UserChallenge[]>;
  createUserChallenge(insertChallenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(id: number, updateData: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined>;
  completeUserChallenge(id: number): Promise<UserChallenge | undefined>;
  deleteUserChallenge(id: number): Promise<boolean>;
  
  // Enhanced Notification operations
  getUserNotification(id: number): Promise<UserNotification | undefined>;
  getUserNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUnreadUserNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUserNotificationsByType(type: string): Promise<UserNotification[]>;
  getUserNotificationsByObject(objectType: string, objectId: number): Promise<UserNotification[]>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markUserNotificationAsRead(id: number): Promise<UserNotification | undefined>;
  markAllUserNotificationsAsRead(userId: number): Promise<number>;
  deleteUserNotification(id: number): Promise<boolean>;
  deleteAllUserNotifications(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private appraisalReports: Map<number, AppraisalReport>;
  private comparables: Map<number, Comparable>;
  private adjustments: Map<number, Adjustment>;
  private photos: Map<number, Photo>;
  private sketches: Map<number, Sketch>;
  private complianceChecks: Map<number, ComplianceCheck>;
  private realEstateTerms: Map<number, RealEstateTerm>;
  
  // Gamification system
  private achievementDefinitions: Map<number, AchievementDefinition>;
  private userAchievements: Map<number, UserAchievement>;
  private levels: Map<number, Level>;
  private userProgress: Map<number, UserProgress>;
  private userChallenges: Map<number, UserChallenge>;
  private userNotifications: Map<number, UserNotification>;
  private orders: Map<number, Order>;
  
  // Reviewer UX system
  private reviewRequests: Map<number, ReviewRequest>;
  private comments: Map<number, Comment>;
  private annotations: Map<number, Annotation>;
  private revisionHistory: Map<number, RevisionHistory>;
  
  private currentUserId: number;
  private currentPropertyId: number;
  private currentReportId: number;
  private currentComparableId: number;
  private currentAdjustmentId: number;
  private currentPhotoId: number;
  private currentSketchId: number;
  private currentComplianceCheckId: number;
  private currentRealEstateTermId: number;
  private currentOrderId: number;
  private currentAchievementDefinitionId: number;
  private currentUserAchievementId: number;
  private currentLevelId: number;
  private currentUserProgressId: number;
  private currentUserChallengeId: number;
  private currentUserNotificationId: number;
  
  // Reviewer UX ID counters
  private currentReviewRequestId: number;
  private currentCommentId: number;
  private currentAnnotationId: number;
  private currentRevisionHistoryId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.appraisalReports = new Map();
    this.comparables = new Map();
    this.adjustments = new Map();
    this.photos = new Map();
    this.sketches = new Map();
    this.complianceChecks = new Map();
    this.realEstateTerms = new Map();
    this.orders = new Map();
    
    // Initialize gamification maps
    this.achievementDefinitions = new Map();
    this.userAchievements = new Map();
    this.levels = new Map();
    this.userProgress = new Map();
    this.userChallenges = new Map();
    this.userNotifications = new Map();
    
    // Initialize reviewer UX maps
    this.reviewRequests = new Map();
    this.comments = new Map();
    this.annotations = new Map();
    this.revisionHistory = new Map();
    
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentReportId = 1;
    this.currentComparableId = 1;
    this.currentAdjustmentId = 1;
    this.currentPhotoId = 1;
    this.currentSketchId = 1;
    this.currentComplianceCheckId = 1;
    this.currentRealEstateTermId = 1;
    this.currentOrderId = 1;
    
    // Initialize gamification ID counters
    this.currentAchievementDefinitionId = 1;
    this.currentUserAchievementId = 1;
    this.currentLevelId = 1;
    this.currentUserProgressId = 1;
    this.currentUserChallengeId = 1;
    this.currentUserNotificationId = 1;
    
    // Initialize reviewer UX ID counters
    this.currentReviewRequestId = 1;
    this.currentCommentId = 1;
    this.currentAnnotationId = 1;
    this.currentRevisionHistoryId = 1;
    
    // Add demo user
    this.users.set(1, {
      id: 1,
      username: "demo",
      password: "password",
      fullName: "John Appraiser",
      company: "ABC Appraisal",
      licenseNumber: "AP12345",
      email: "john@abcappraisal.com",
      phoneNumber: "555-123-4567"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(
      (property) => property.userId === userId
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const now = new Date();
    const property: Property = { 
      ...insertProperty, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, updateData: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    const updatedProperty: Property = {
      ...property,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  // Appraisal report methods
  async getAppraisalReport(id: number): Promise<AppraisalReport | undefined> {
    return this.appraisalReports.get(id);
  }

  async getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter(
      (report) => report.userId === userId
    );
  }

  async getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter(
      (report) => report.propertyId === propertyId
    );
  }

  async createAppraisalReport(insertReport: InsertAppraisalReport): Promise<AppraisalReport> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: AppraisalReport = { 
      ...insertReport, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.appraisalReports.set(id, report);
    return report;
  }

  async updateAppraisalReport(id: number, updateData: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined> {
    const report = this.appraisalReports.get(id);
    if (!report) return undefined;
    
    const updatedReport: AppraisalReport = {
      ...report,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.appraisalReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteAppraisalReport(id: number): Promise<boolean> {
    return this.appraisalReports.delete(id);
  }

  // Comparable methods
  async getComparable(id: number): Promise<Comparable | undefined> {
    return this.comparables.get(id);
  }

  async getComparablesByReport(reportId: number): Promise<Comparable[]> {
    return Array.from(this.comparables.values()).filter(
      (comparable) => comparable.reportId === reportId
    );
  }

  async createComparable(insertComparable: InsertComparable): Promise<Comparable> {
    const id = this.currentComparableId++;
    const now = new Date();
    const comparable: Comparable = { 
      ...insertComparable, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.comparables.set(id, comparable);
    return comparable;
  }

  async updateComparable(id: number, updateData: Partial<InsertComparable>): Promise<Comparable | undefined> {
    const comparable = this.comparables.get(id);
    if (!comparable) return undefined;
    
    const updatedComparable: Comparable = {
      ...comparable,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.comparables.set(id, updatedComparable);
    return updatedComparable;
  }

  async deleteComparable(id: number): Promise<boolean> {
    return this.comparables.delete(id);
  }

  // Adjustment methods
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    return this.adjustments.get(id);
  }

  async getAdjustmentsByReport(reportId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.reportId === reportId
    );
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.comparableId === comparableId
    );
  }

  async createAdjustment(insertAdjustment: InsertAdjustment): Promise<Adjustment> {
    const id = this.currentAdjustmentId++;
    const now = new Date();
    const adjustment: Adjustment = { 
      ...insertAdjustment, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.adjustments.set(id, adjustment);
    return adjustment;
  }

  async updateAdjustment(id: number, updateData: Partial<InsertAdjustment>): Promise<Adjustment | undefined> {
    const adjustment = this.adjustments.get(id);
    if (!adjustment) return undefined;
    
    const updatedAdjustment: Adjustment = {
      ...adjustment,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.adjustments.set(id, updatedAdjustment);
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    return this.adjustments.delete(id);
  }

  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByReport(reportId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(
      (photo) => photo.reportId === reportId
    );
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const now = new Date();
    const photo: Photo = { 
      ...insertPhoto, 
      id,
      createdAt: now
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, updateData: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto: Photo = {
      ...photo,
      ...updateData
    };
    
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Sketch methods
  async getSketch(id: number): Promise<Sketch | undefined> {
    return this.sketches.get(id);
  }

  async getSketchesByReport(reportId: number): Promise<Sketch[]> {
    return Array.from(this.sketches.values()).filter(
      (sketch) => sketch.reportId === reportId
    );
  }

  async createSketch(insertSketch: InsertSketch): Promise<Sketch> {
    const id = this.currentSketchId++;
    const now = new Date();
    const sketch: Sketch = { 
      ...insertSketch, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.sketches.set(id, sketch);
    return sketch;
  }

  async updateSketch(id: number, updateData: Partial<InsertSketch>): Promise<Sketch | undefined> {
    const sketch = this.sketches.get(id);
    if (!sketch) return undefined;
    
    const updatedSketch: Sketch = {
      ...sketch,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.sketches.set(id, updatedSketch);
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    return this.sketches.delete(id);
  }

  // Compliance check methods
  async getComplianceCheck(id: number): Promise<ComplianceCheck | undefined> {
    return this.complianceChecks.get(id);
  }

  async getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]> {
    return Array.from(this.complianceChecks.values()).filter(
      (check) => check.reportId === reportId
    );
  }

  async createComplianceCheck(insertCheck: InsertComplianceCheck): Promise<ComplianceCheck> {
    const id = this.currentComplianceCheckId++;
    const now = new Date();
    const check: ComplianceCheck = { 
      ...insertCheck, 
      id,
      createdAt: now
    };
    this.complianceChecks.set(id, check);
    return check;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    return this.complianceChecks.delete(id);
  }
  
  // Real Estate Term methods
  async getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined> {
    return this.realEstateTerms.get(id);
  }
  
  async getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined> {
    return Array.from(this.realEstateTerms.values()).find(
      (realEstateTerm) => realEstateTerm.term.toLowerCase() === term.toLowerCase()
    );
  }
  
  async getAllRealEstateTerms(): Promise<RealEstateTerm[]> {
    return Array.from(this.realEstateTerms.values());
  }
  
  async getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]> {
    return Array.from(this.realEstateTerms.values()).filter(
      (term) => term.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  async getTermsByNames(termNames: string[]): Promise<RealEstateTerm[]> {
    const lowerTermNames = termNames.map(name => name.toLowerCase());
    return Array.from(this.realEstateTerms.values()).filter(
      (term) => lowerTermNames.includes(term.term.toLowerCase())
    );
  }
  
  async createRealEstateTerm(insertTerm: InsertRealEstateTerm): Promise<RealEstateTerm> {
    const id = this.currentRealEstateTermId++;
    const now = new Date();
    const term: RealEstateTerm = {
      ...insertTerm,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.realEstateTerms.set(id, term);
    return term;
  }
  
  async updateRealEstateTerm(id: number, updateData: Partial<InsertRealEstateTerm>): Promise<RealEstateTerm | undefined> {
    const term = this.realEstateTerms.get(id);
    if (!term) return undefined;
    
    const updatedTerm: RealEstateTerm = {
      ...term,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.realEstateTerms.set(id, updatedTerm);
    return updatedTerm;
  }
  
  async deleteRealEstateTerm(id: number): Promise<boolean> {
    return this.realEstateTerms.delete(id);
  }
  
  // Review Request methods
  async getReviewRequest(id: number): Promise<ReviewRequest | undefined> {
    return this.reviewRequests.get(id);
  }
  
  async getReviewRequestsByObject(objectType: string, objectId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.objectType === objectType && request.objectId === objectId
    );
  }
  
  async getReviewRequestsByRequestor(userId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.requestorId === userId
    );
  }
  
  async getReviewRequestsByAssignee(userId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.assigneeId === userId
    );
  }
  
  async getReviewRequestsByStatus(status: string): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.status === status
    );
  }
  
  async createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest> {
    const id = this.currentReviewRequestId++;
    const now = new Date();
    const newRequest: ReviewRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.reviewRequests.set(id, newRequest);
    return newRequest;
  }
  
  async updateReviewRequest(id: number, request: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined> {
    const reviewRequest = this.reviewRequests.get(id);
    if (!reviewRequest) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...reviewRequest,
      ...request,
      updatedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async updateReviewRequestStatus(id: number, status: string): Promise<ReviewRequest | undefined> {
    const reviewRequest = this.reviewRequests.get(id);
    if (!reviewRequest) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...reviewRequest,
      status,
      updatedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async deleteReviewRequest(id: number): Promise<boolean> {
    return this.reviewRequests.delete(id);
  }
  
  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.objectType === objectType && comment.objectId === objectId
    );
  }
  
  async getCommentsByUser(userId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.userId === userId
    );
  }
  
  async getCommentsByParent(parentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.parentId === parentId
    );
  }
  
  async getCommentsByType(commentType: string): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.commentType === commentType
    );
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    const existingComment = this.comments.get(id);
    if (!existingComment) return undefined;
    
    const updatedComment: Comment = {
      ...existingComment,
      ...comment,
      updatedAt: new Date()
    };
    
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async resolveComment(id: number, resolved: boolean): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment: Comment = {
      ...comment,
      resolved,
      updatedAt: new Date()
    };
    
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Annotation methods
  async getAnnotation(id: number): Promise<Annotation | undefined> {
    return this.annotations.get(id);
  }
  
  async getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(
      (annotation) => annotation.objectType === objectType && annotation.objectId === objectId
    );
  }
  
  async getAnnotationsByUser(userId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(
      (annotation) => annotation.userId === userId
    );
  }
  
  async getAnnotationsByType(annotationType: string): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(
      (annotation) => annotation.annotationType === annotationType
    );
  }
  
  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const id = this.currentAnnotationId++;
    const now = new Date();
    const newAnnotation: Annotation = {
      ...annotation,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.annotations.set(id, newAnnotation);
    return newAnnotation;
  }
  
  async updateAnnotation(id: number, annotation: Partial<InsertAnnotation>): Promise<Annotation | undefined> {
    const existingAnnotation = this.annotations.get(id);
    if (!existingAnnotation) return undefined;
    
    const updatedAnnotation: Annotation = {
      ...existingAnnotation,
      ...annotation,
      updatedAt: new Date()
    };
    
    this.annotations.set(id, updatedAnnotation);
    return updatedAnnotation;
  }
  
  async deleteAnnotation(id: number): Promise<boolean> {
    return this.annotations.delete(id);
  }
  
  // Revision History methods
  async getRevisionHistory(id: number): Promise<RevisionHistory | undefined> {
    return this.revisionHistory.get(id);
  }
  
  async getRevisionHistoryByObject(objectType: string, objectId: number): Promise<RevisionHistory[]> {
    return Array.from(this.revisionHistory.values()).filter(
      (revision) => revision.objectType === objectType && revision.objectId === objectId
    );
  }
  
  async getRevisionHistoryByUser(userId: number): Promise<RevisionHistory[]> {
    return Array.from(this.revisionHistory.values()).filter(
      (revision) => revision.userId === userId
    );
  }
  
  async createRevisionHistory(revision: InsertRevisionHistory): Promise<RevisionHistory> {
    const id = this.currentRevisionHistoryId++;
    const now = new Date();
    const newRevision: RevisionHistory = {
      ...revision,
      id,
      createdAt: now
    };
    
    this.revisionHistory.set(id, newRevision);
    return newRevision;
  }
  
  // Review Request methods
  async getReviewRequest(id: number): Promise<ReviewRequest | undefined> {
    return this.reviewRequests.get(id);
  }
  
  async getReviewRequestsByObject(objectType: string, objectId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.objectType === objectType && request.objectId === objectId
    );
  }
  
  async getReviewRequestsByRequester(requesterId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.requesterId === requesterId
    );
  }
  
  async getReviewRequestsByReviewer(reviewerId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.reviewerId === reviewerId
    );
  }
  
  async getPendingReviewRequests(): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.status === 'pending'
    );
  }
  
  async getReviewRequestsByStatus(status: string): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.status === status
    );
  }
  
  async createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest> {
    const id = this.currentReviewRequestId++;
    const now = new Date();
    const newRequest: ReviewRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
      status: request.status || 'pending',
      completedAt: null
    };
    
    this.reviewRequests.set(id, newRequest);
    return newRequest;
  }
  
  async updateReviewRequest(id: number, updateData: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined> {
    const request = this.reviewRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...request,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async completeReviewRequest(id: number, approved: boolean): Promise<ReviewRequest | undefined> {
    const request = this.reviewRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...request,
      status: approved ? 'approved' : 'rejected',
      completedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async deleteReviewRequest(id: number): Promise<boolean> {
    return this.reviewRequests.delete(id);
  }

  // Achievement Definition methods
  async getAchievementDefinition(id: number): Promise<AchievementDefinition | undefined> {
    return this.achievementDefinitions.get(id);
  }

  async getAllAchievementDefinitions(): Promise<AchievementDefinition[]> {
    return Array.from(this.achievementDefinitions.values());
  }

  async getAchievementDefinitionsByType(type: string): Promise<AchievementDefinition[]> {
    return Array.from(this.achievementDefinitions.values()).filter(
      (def) => def.type === type
    );
  }

  async createAchievementDefinition(insertDef: InsertAchievementDefinition): Promise<AchievementDefinition> {
    const id = this.currentAchievementDefinitionId++;
    const now = new Date();
    const definition: AchievementDefinition = {
      ...insertDef,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.achievementDefinitions.set(id, definition);
    return definition;
  }

  async updateAchievementDefinition(id: number, updateData: Partial<InsertAchievementDefinition>): Promise<AchievementDefinition | undefined> {
    const definition = this.achievementDefinitions.get(id);
    if (!definition) return undefined;
    
    const updatedDefinition: AchievementDefinition = {
      ...definition,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.achievementDefinitions.set(id, updatedDefinition);
    return updatedDefinition;
  }

  async deleteAchievementDefinition(id: number): Promise<boolean> {
    return this.achievementDefinitions.delete(id);
  }

  // User Achievement methods
  async getUserAchievement(id: number): Promise<UserAchievement | undefined> {
    return this.userAchievements.get(id);
  }

  async getUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values()).filter(
      (achievement) => achievement.userId === userId
    );
  }

  async getUserAchievementByUserAndDefinition(userId: number, definitionId: number): Promise<UserAchievement | undefined> {
    return Array.from(this.userAchievements.values()).find(
      (achievement) => achievement.userId === userId && achievement.achievementDefinitionId === definitionId
    );
  }

  async createUserAchievement(insertAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.currentUserAchievementId++;
    const now = new Date();
    const achievement: UserAchievement = {
      ...insertAchievement,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    this.userAchievements.set(id, achievement);
    return achievement;
  }

  async updateUserAchievement(id: number, updateData: Partial<InsertUserAchievement>): Promise<UserAchievement | undefined> {
    const achievement = this.userAchievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement: UserAchievement = {
      ...achievement,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.userAchievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async completeUserAchievement(id: number): Promise<UserAchievement | undefined> {
    const achievement = this.userAchievements.get(id);
    if (!achievement) return undefined;
    
    const completedAchievement: UserAchievement = {
      ...achievement,
      completed: true,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userAchievements.set(id, completedAchievement);
    return completedAchievement;
  }

  async deleteUserAchievement(id: number): Promise<boolean> {
    return this.userAchievements.delete(id);
  }

  // Level methods
  async getLevel(id: number): Promise<Level | undefined> {
    return this.levels.get(id);
  }

  async getLevelByNumber(levelNumber: number): Promise<Level | undefined> {
    return Array.from(this.levels.values()).find(
      (level) => level.level === levelNumber
    );
  }

  async getAllLevels(): Promise<Level[]> {
    return Array.from(this.levels.values()).sort((a, b) => a.level - b.level);
  }

  async createLevel(insertLevel: InsertLevel): Promise<Level> {
    const id = this.currentLevelId++;
    const now = new Date();
    const level: Level = {
      ...insertLevel,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.levels.set(id, level);
    return level;
  }

  async updateLevel(id: number, updateData: Partial<InsertLevel>): Promise<Level | undefined> {
    const level = this.levels.get(id);
    if (!level) return undefined;
    
    const updatedLevel: Level = {
      ...level,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.levels.set(id, updatedLevel);
    return updatedLevel;
  }

  async deleteLevel(id: number): Promise<boolean> {
    return this.levels.delete(id);
  }

  // User Progress methods
  async getUserProgress(id: number): Promise<UserProgress | undefined> {
    return this.userProgress.get(id);
  }

  async getUserProgressByUser(userId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId
    );
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentUserProgressId++;
    const now = new Date();
    const progress: UserProgress = {
      ...insertProgress,
      id,
      createdAt: now,
      updatedAt: now,
      lastActive: now
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async updateUserProgress(id: number, updateData: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const progress = this.userProgress.get(id);
    if (!progress) return undefined;
    
    const updatedProgress: UserProgress = {
      ...progress,
      ...updateData,
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    this.userProgress.set(id, updatedProgress);
    return updatedProgress;
  }

  async incrementPropertyEvaluations(userId: number): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId
    );
    
    if (!progress) return undefined;
    
    const updatedProgress: UserProgress = {
      ...progress,
      propertyEvaluations: progress.propertyEvaluations + 1,
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    this.userProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  async incrementUserStreak(userId: number): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId
    );
    
    if (!progress) return undefined;
    
    const newCurrentStreak = progress.currentStreak + 1;
    const newLongestStreak = Math.max(progress.longestStreak, newCurrentStreak);
    
    const updatedProgress: UserProgress = {
      ...progress,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    this.userProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  async resetUserStreak(userId: number): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId
    );
    
    if (!progress) return undefined;
    
    const updatedProgress: UserProgress = {
      ...progress,
      currentStreak: 0,
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    this.userProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  async levelUpUser(userId: number): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId
    );
    
    if (!progress) return undefined;
    
    const updatedProgress: UserProgress = {
      ...progress,
      level: progress.level + 1,
      updatedAt: new Date(),
      lastActive: new Date()
    };
    
    this.userProgress.set(progress.id, updatedProgress);
    return updatedProgress;
  }

  async deleteUserProgress(id: number): Promise<boolean> {
    return this.userProgress.delete(id);
  }

  // User Challenge methods
  async getUserChallenge(id: number): Promise<UserChallenge | undefined> {
    return this.userChallenges.get(id);
  }

  async getUserChallengesByUser(userId: number): Promise<UserChallenge[]> {
    return Array.from(this.userChallenges.values()).filter(
      (challenge) => challenge.userId === userId
    );
  }

  async getActiveUserChallengesByUser(userId: number): Promise<UserChallenge[]> {
    return Array.from(this.userChallenges.values()).filter(
      (challenge) => challenge.userId === userId && !challenge.completed
    );
  }

  async createUserChallenge(insertChallenge: InsertUserChallenge): Promise<UserChallenge> {
    const id = this.currentUserChallengeId++;
    const now = new Date();
    const challenge: UserChallenge = {
      ...insertChallenge,
      id,
      createdAt: now,
      updatedAt: now,
      completed: false,
      completedAt: null
    };
    this.userChallenges.set(id, challenge);
    return challenge;
  }

  async updateUserChallenge(id: number, updateData: Partial<InsertUserChallenge>): Promise<UserChallenge | undefined> {
    const challenge = this.userChallenges.get(id);
    if (!challenge) return undefined;
    
    const updatedChallenge: UserChallenge = {
      ...challenge,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.userChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async completeUserChallenge(id: number): Promise<UserChallenge | undefined> {
    const challenge = this.userChallenges.get(id);
    if (!challenge) return undefined;
    
    const completedChallenge: UserChallenge = {
      ...challenge,
      completed: true,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userChallenges.set(id, completedChallenge);
    return completedChallenge;
  }

  async deleteUserChallenge(id: number): Promise<boolean> {
    return this.userChallenges.delete(id);
  }

  // User Notification methods
  async getUserNotification(id: number): Promise<UserNotification | undefined> {
    return this.userNotifications.get(id);
  }
  
  async getUserNotificationsByUser(userId: number): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values()).filter(
      (notification) => notification.userId === userId
    );
  }
  
  async getUnreadUserNotificationsByUser(userId: number): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values()).filter(
      (notification) => notification.userId === userId && !notification.read
    );
  }
  
  async getUserNotificationsByType(type: string): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values()).filter(
      (notification) => notification.type === type
    );
  }
  
  async getUserNotificationsByObject(objectType: string, objectId: number): Promise<UserNotification[]> {
    return Array.from(this.userNotifications.values()).filter(
      (notification) => notification.objectType === objectType && notification.objectId === objectId
    );
  }
  
  async createUserNotification(notification: InsertUserNotification): Promise<UserNotification> {
    const id = this.currentUserNotificationId++;
    const now = new Date();
    const newNotification: UserNotification = {
      ...notification,
      id,
      createdAt: now,
      updatedAt: now,
      read: false,
      readAt: null
    };
    
    this.userNotifications.set(id, newNotification);
    return newNotification;
  }
  
  async markUserNotificationAsRead(id: number): Promise<UserNotification | undefined> {
    const notification = this.userNotifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: UserNotification = {
      ...notification,
      read: true,
      readAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userNotifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllUserNotificationsAsRead(userId: number): Promise<number> {
    const notifications = Array.from(this.userNotifications.values()).filter(
      (notification) => notification.userId === userId && !notification.read
    );
    
    const now = new Date();
    let count = 0;
    
    for (const notification of notifications) {
      const updatedNotification: UserNotification = {
        ...notification,
        read: true,
        readAt: now,
        updatedAt: now
      };
      
      this.userNotifications.set(notification.id, updatedNotification);
      count++;
    }
    
    return count;
  }
  
  async deleteUserNotification(id: number): Promise<boolean> {
    return this.userNotifications.delete(id);
  }
  
  async deleteAllUserNotifications(userId: number): Promise<number> {
    const notifications = Array.from(this.userNotifications.values()).filter(
      (notification) => notification.userId === userId
    );
    
    let count = 0;
    for (const notification of notifications) {
      if (this.userNotifications.delete(notification.id)) {
        count++;
      }
    }
    
    return count;
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async getOrdersByProperty(propertyId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.propertyId === propertyId
    );
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status.toLowerCase() === status.toLowerCase()
    );
  }

  async getOrdersByType(type: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.orderType.toLowerCase() === type.toLowerCase()
    );
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      ...orderData,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updatedOrder.notes = notes;
    }
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Reviewer UX implementation - Review Requests
  async getReviewRequest(id: number): Promise<ReviewRequest | undefined> {
    return this.reviewRequests.get(id);
  }

  async getReviewRequestsByObject(objectType: string, objectId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(req => 
      req.objectType === objectType && req.objectId === objectId
    );
  }

  async getReviewRequestsByRequester(requesterId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(req => 
      req.requesterId === requesterId
    );
  }

  async getReviewRequestsByReviewer(reviewerId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(req => 
      req.reviewerId === reviewerId
    );
  }

  async getPendingReviewRequests(): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(req => 
      req.status === 'pending'
    );
  }

  async getReviewRequestsByStatus(status: string): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(req => 
      req.status === status
    );
  }

  async createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest> {
    const id = this.currentReviewRequestId++;
    const now = new Date();
    const newRequest: ReviewRequest = {
      ...request,
      id,
      createdAt: now,
      updatedAt: now,
      status: request.status || 'pending',
    };
    this.reviewRequests.set(id, newRequest);
    return newRequest;
  }

  async updateReviewRequest(id: number, updateData: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined> {
    const request = this.reviewRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...request,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async completeReviewRequest(id: number, approved: boolean): Promise<ReviewRequest | undefined> {
    const request = this.reviewRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: ReviewRequest = {
      ...request,
      status: approved ? 'approved' : 'rejected',
      updatedAt: new Date(),
      completedAt: new Date()
    };
    
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteReviewRequest(id: number): Promise<boolean> {
    return this.reviewRequests.delete(id);
  }

  // Reviewer UX implementation - Comments
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.objectType === objectType && comment.objectId === objectId
    );
  }

  async getCommentsByUser(userId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.userId === userId
    );
  }

  async getCommentsByThread(threadId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.threadId === threadId
    );
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async updateComment(id: number, updateData: Partial<InsertComment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment: Comment = {
      ...comment,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Reviewer UX implementation - Annotations
  async getAnnotation(id: number): Promise<Annotation | undefined> {
    return this.annotations.get(id);
  }

  async getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(annotation => 
      annotation.objectType === objectType && annotation.objectId === objectId
    );
  }

  async getAnnotationsByUser(userId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(annotation => 
      annotation.userId === userId
    );
  }

  async getAnnotationsByType(annotationType: string): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(annotation => 
      annotation.type === annotationType
    );
  }

  async createAnnotation(annotation: InsertAnnotation): Promise<Annotation> {
    const id = this.currentAnnotationId++;
    const now = new Date();
    const newAnnotation: Annotation = {
      ...annotation,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.annotations.set(id, newAnnotation);
    return newAnnotation;
  }

  async updateAnnotation(id: number, updateData: Partial<InsertAnnotation>): Promise<Annotation | undefined> {
    const annotation = this.annotations.get(id);
    if (!annotation) return undefined;
    
    const updatedAnnotation: Annotation = {
      ...annotation,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.annotations.set(id, updatedAnnotation);
    return updatedAnnotation;
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    return this.annotations.delete(id);
  }

  // Reviewer UX implementation - Revision History
  async getRevisionHistory(id: number): Promise<RevisionHistory | undefined> {
    return this.revisionHistory.get(id);
  }

  async getRevisionHistoryByObject(objectType: string, objectId: number): Promise<RevisionHistory[]> {
    return Array.from(this.revisionHistory.values()).filter(revision => 
      revision.objectType === objectType && revision.objectId === objectId
    );
  }

  async getRevisionHistoryByUser(userId: number): Promise<RevisionHistory[]> {
    return Array.from(this.revisionHistory.values()).filter(revision => 
      revision.userId === userId
    );
  }

  async createRevisionHistory(revision: InsertRevisionHistory): Promise<RevisionHistory> {
    const id = this.currentRevisionHistoryId++;
    const now = new Date();
    const newRevision: RevisionHistory = {
      ...revision,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.revisionHistory.set(id, newRevision);
    return newRevision;
  }
}

import { DatabaseStorage } from "./database-storage";

// Type for updating file import result
export interface FileImportResultUpdate {
  status?: 'processing' | 'completed' | 'failed';
  entitiesExtracted?: number;
  errors?: string[];
  warnings?: string[];
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();
