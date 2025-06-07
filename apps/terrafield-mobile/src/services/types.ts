/**
 * Notification types for the TerraField Mobile app
 */
export enum NotificationType {
  // System notifications
  SYSTEM = "SYSTEM",

  // Photo-related notifications
  PHOTO_UPLOADED = "PHOTO_UPLOADED",
  PHOTO_ENHANCEMENT_STARTED = "PHOTO_ENHANCEMENT_STARTED",
  PHOTO_ENHANCEMENT_COMPLETED = "PHOTO_ENHANCEMENT_COMPLETED",
  PHOTO_ENHANCEMENT_FAILED = "PHOTO_ENHANCEMENT_FAILED",

  // Sync status notifications
  SYNC_STARTED = "SYNC_STARTED",
  SYNC_COMPLETED = "SYNC_COMPLETED",
  SYNC_FAILED = "SYNC_FAILED",
  SYNC_PROGRESS = "SYNC_PROGRESS",
  OFFLINE_QUEUE_UPDATED = "OFFLINE_QUEUE_UPDATED",

  // Conflict notifications
  CONFLICT_DETECTED = "CONFLICT_DETECTED",
  CONFLICT_RESOLVED = "CONFLICT_RESOLVED",
  CONFLICT_RESOLUTION_REQUIRED = "CONFLICT_RESOLUTION_REQUIRED",

  // Report notifications
  REPORT_GENERATED = "REPORT_GENERATED",
  REPORT_SHARED = "REPORT_SHARED",
  REPORT_EXPORTED = "REPORT_EXPORTED",

  // Property notifications
  PROPERTY_UPDATED = "PROPERTY_UPDATED",
  PROPERTY_DATA_FETCHED = "PROPERTY_DATA_FETCHED",
  MARKET_DATA_UPDATED = "MARKET_DATA_UPDATED",

  // Workflow notifications
  ASSIGNMENT_RECEIVED = "ASSIGNMENT_RECEIVED",
  ASSIGNMENT_COMPLETED = "ASSIGNMENT_COMPLETED",
  DEADLINE_APPROACHING = "DEADLINE_APPROACHING",

  // Compliance notifications
  COMPLIANCE_CHECK_STARTED = "COMPLIANCE_CHECK_STARTED",
  COMPLIANCE_CHECK_COMPLETED = "COMPLIANCE_CHECK_COMPLETED",
  COMPLIANCE_ISSUE_DETECTED = "COMPLIANCE_ISSUE_DETECTED",
}

/**
 * Structure of a notification
 */
export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

/**
 * Structure of an event message sent via WebSocket
 */
export interface WebSocketEvent {
  eventType: string;
  payload: any;
  timestamp: number;
}

/**
 * Structure of a photo enhancement request
 */
export interface PhotoEnhancementRequest {
  photoId: string;
  originalUrl: string;
  propertyId?: string;
  enhancementOptions?: {
    enhanceQuality?: boolean;
    fixLighting?: boolean;
    removeGlare?: boolean;
    detectFeatures?: boolean;
    correctPerspective?: boolean;
  };
}

/**
 * Structure of a photo enhancement result
 */
export interface PhotoEnhancementResult {
  photoId: string;
  originalUrl: string;
  enhancedUrl: string;
  detectedFeatures?: string[];
  metaData?: Record<string, any>;
  processingTime?: number;
  error?: string;
  status: "completed" | "failed" | "processing";
}

/**
 * Structure of a property data record
 */
export interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  hasGarage?: boolean;
  hasPool?: boolean;
  lastModified: Date;
  createdAt: Date;
  additionalFeatures?: Record<string, any>;
}

/**
 * Structure of an appraisal report
 */
export interface AppraisalReport {
  id: string;
  propertyId: string;
  reportType: string;
  status: string;
  effectiveDate: Date;
  completionDate?: Date;
  appraiser: string;
  clientName: string;
  purposeOfAppraisal: string;
  opinionOfValue?: number;
  lastModified: Date;
  createdAt: Date;
}

/**
 * Structure of comparable data
 */
export interface ComparableData {
  id: string;
  reportId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate?: Date;
  salePrice?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  propertyType: string;
  distanceFromSubject?: number;
  adjustments?: Record<string, number>;
  adjustedPrice?: number;
  lastModified: Date;
  createdAt: Date;
}

/**
 * Base service interface
 */
export interface Service {
  name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Service metadata
 */
export interface ServiceMetadata {
  name: string;
  version: string;
  dependencies: string[];
  status: 'initialized' | 'error' | 'unknown';
  error?: string;
}

/**
 * Service information
 */
export interface ServiceInfo {
  metadata: ServiceMetadata;
  instance: Service;
}

/**
 * Service registry interface
 */
export interface ServiceRegistry {
  initialize(): Promise<void>;
  registerService(name: string, service: Service): void;
  getService<T extends Service>(name: string): T | undefined;
  getServices(): Map<string, Service>;
  unregisterService(name: string): void;
  getServiceMetadata(key: string): ServiceMetadata;
  getAllServices(): Map<string, ServiceInfo>;
  getServiceStatus(key: string): ServiceMetadata['status'];
  addServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void;
  removeServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void;
  reset(): Promise<void>;
  isInitialized(): boolean;
  getInitializedServices(): string[];
  getServiceDependencies(key: string): string[];
  getDependentServices(key: string): string[];
}

/**
 * Security levels for storage
 */
export enum SecurityLevel {
  NORMAL = "normal",
  MEDIUM = "medium",
  SENSITIVE = "sensitive",
  HIGH = "high",
  VERY_SENSITIVE = "very_sensitive"
}

/**
 * Secure storage options
 */
export interface SecureStorageOptions {
  securityLevel: SecurityLevel;
  requireBiometrics?: boolean;
  biometricReason?: string;
}

/**
 * Auth service interface
 */
export interface AuthService extends Service {
  getUserId(): Promise<string | null>;
  getUserDisplayName(): Promise<string | null>;
  hasDigitalSignatureSupport(): Promise<boolean>;
  createDigitalSignature(documentId: string): Promise<string | null>;
  getToken(): Promise<string | null>;
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  login(usernameOrEmail: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  authenticateWithBiometrics(reason?: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
  hasAnyPermission(permissions: string[]): boolean;
  hasAllPermissions(permissions: string[]): boolean;
}

/**
 * User model
 */
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Operation types for offline queue
 */
export enum OperationType {
  CREATE_REPORT = "create_report",
  UPDATE_REPORT = "update_report",
  DELETE_REPORT = "delete_report",
  UPLOAD_PHOTO = "upload_photo",
  DELETE_PHOTO = "delete_photo",
  UPLOAD_TEMPLATE = "upload_template",
  DELETE_TEMPLATE = "delete_template",
  PROCESS_TRANSCRIPTION = "process_transcription"
}
