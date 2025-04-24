/**
 * Root stack parameter list
 */
export type RootStackParamList = {
  // Auth
  Auth: undefined;
  
  // Main
  Main: undefined;
  
  // Home stack
  Dashboard: undefined;
  PropertyList: undefined;
  PropertyDetail: { propertyId: string };
  
  // Inspection stack
  Inspection: undefined;
  FormCapture: { propertyId?: string };
  VoiceForm: { propertyId?: string };
  PhotoEnhancement: { propertyId?: string; photos?: any[] };
  ARMeasurement: { propertyId?: string };
  
  // Analysis stack
  ComparableSearch: { property?: any };
  AdjustmentModel: { propertyId?: string; comparableIds?: string[] };
  
  // Reports stack
  ReportGeneration: { propertyId?: string };
  ComplianceDocument: { reportId?: string; documentType?: string };
  
  // Collaboration stack
  Collaboration: { projectId?: string; projectName?: string };
  SyncStatus: undefined;
  
  // Profile stack
  Profile: undefined;
  SecuritySettings: undefined;
};

/**
 * Main tab parameter list
 */
export type MainTabParamList = {
  Home: undefined;
  Inspection: undefined;
  Analysis: undefined;
  Reports: undefined;
  Collaborate: undefined;
  Profile: undefined;
};