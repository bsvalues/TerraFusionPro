export interface Field {
  id: string;
  name: string;
  soilType: string;
  cropType?: string;
  area: number;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  createdAt: string;
  updatedAt: string;
} 