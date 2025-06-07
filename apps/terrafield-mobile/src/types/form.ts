export interface Form {
  id: string;
  type: string;
  data: Record<string, any>;
  fieldId?: string;
  userId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
} 