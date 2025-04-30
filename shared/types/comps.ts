/**
 * Shared types for comparable property data and operations
 */

/**
 * ComparableSnapshot represents a historical point-in-time record of property data
 */
export interface ComparableSnapshot {
  id: string;
  propertyId: string;
  version: number;
  createdAt: string;
  source: string; // e.g., 'mls import', 'api update', 'manual edit', 'form push'
  fields: Record<string, any>; // The actual property data fields
  metadata?: {
    createdBy?: string;
    sourceId?: string;
    sourceUrl?: string;
    importId?: string;
    system?: string;
    tags?: string[];
  };
}

/**
 * SnapshotFilter for filtering snapshot history
 */
export interface SnapshotFilter {
  propertyId?: string;
  source?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  version?: number;
}

/**
 * PushSnapshotRequest for pushing snapshot data to a form
 */
export interface PushSnapshotRequest {
  snapshotId: string;
  formId: string;
  fieldMappings: Record<string, string>; // Maps form field IDs to snapshot field names
}

/**
 * PushSnapshotResponse returned when pushing snapshot data to a form
 */
export interface PushSnapshotResponse {
  success: boolean;
  formId?: string;
  error?: string;
  newSnapshot?: ComparableSnapshot; // If a new snapshot was created as a result
}

/**
 * Comparable Search Filter options
 */
export interface ComparableSearchFilter {
  location: {
    latitude: number;
    longitude: number;
    radiusInMiles: number;
  } | {
    city: string;
    state: string;
    zipCode?: string;
  };
  propertyType: string;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqFt?: number;
  maxSqFt?: number;
  minPrice?: number;
  maxPrice?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  saleDate?: {
    from: string;
    to: string;
  };
  includeActive?: boolean;
  includeSold?: boolean;
  includePending?: boolean;
  sortBy?: 'distance' | 'price' | 'saleDate' | 'daysOnMarket' | 'yearBuilt' | 'squareFeet';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * ComparableResult representing a property found in search
 */
export interface ComparableResult {
  id: string;
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  price: number;
  pricePerSqFt: number;
  saleDate: string | null;
  daysOnMarket: number | null;
  status: 'active' | 'pending' | 'sold' | 'other';
  photos: string[];
  description: string | null;
  features: string[];
  source: string;
  distanceInMiles?: number;
}

/**
 * ComparableSearchResponse returned from search API
 */
export interface ComparableSearchResponse {
  results: ComparableResult[];
  totalResults: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
}