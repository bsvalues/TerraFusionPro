export interface ComparableSnapshot {
  id: string;
  propertyId: string;
  source: "MLS" | "PublicRecord" | "PriorReport" | "Manual";
  createdAt: string;
  fields: {
    gla: number;
    salePrice: number;
    saleDate: string;
    beds: number;
    baths: number;
    yearBuilt?: number;
    remarks?: string;
    financing?: string;
  };
}

export interface SnapshotFieldMapping {
  snapshotField: keyof ComparableSnapshot['fields'];
  formField: string;
  label: string;
}

export interface PushToFormRequest {
  formId: string;
  snapshotId: string;
  fieldMappings: Record<string, string>; // snapshotField: formField
}

export interface PushToFormResponse {
  success: boolean;
  fields?: Record<string, any>;
  error?: string;
}