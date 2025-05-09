// Mock data for Reviewer functionality

export interface ReviewRequest {
  id: number;
  requesterId: number;
  reviewerId: number | null;
  objectType: string;
  objectId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt: Date | null;
  priority: 'low' | 'medium' | 'high';
  notes: string | null;
}

export interface Comment {
  id: number;
  userId: number;
  objectType: string;
  objectId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  threadId: number | null;
  parentId: number | null;
}

export interface Annotation {
  id: number;
  userId: number;
  objectType: string;
  objectId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  annotationType: string;
  position: string;
}

export interface RevisionHistory {
  id: number;
  userId: number;
  objectType: string;
  objectId: number;
  revisionType: string;
  revisionContent: string;
  createdAt: Date;
  previousVersionId: number | null;
}

// Mock data for testing
export const mockReviewRequests: ReviewRequest[] = [
  {
    id: 1,
    requesterId: 1,
    reviewerId: 2,
    objectType: 'AppraisalReport',
    objectId: 101,
    status: 'in_progress',
    requestedAt: new Date('2025-05-07T10:30:00'),
    completedAt: null,
    priority: 'high',
    notes: 'Please review this appraisal report for compliance with new regulations.',
  },
  {
    id: 2,
    requesterId: 1,
    reviewerId: null,
    objectType: 'AppraisalReport',
    objectId: 102,
    status: 'pending',
    requestedAt: new Date('2025-05-08T14:15:00'),
    completedAt: null,
    priority: 'medium',
    notes: 'This is a rush order for a residential property in downtown.',
  },
  {
    id: 3,
    requesterId: 2,
    reviewerId: 1,
    objectType: 'Comparable',
    objectId: 201,
    status: 'completed',
    requestedAt: new Date('2025-05-06T09:45:00'),
    completedAt: new Date('2025-05-06T16:20:00'),
    priority: 'low',
    notes: 'Comparable analysis needs to be reviewed for accuracy.',
  },
  {
    id: 4,
    requesterId: 3,
    reviewerId: 1,
    objectType: 'AppraisalReport',
    objectId: 103,
    status: 'rejected',
    requestedAt: new Date('2025-05-05T11:00:00'),
    completedAt: new Date('2025-05-05T17:30:00'),
    priority: 'high',
    notes: 'Rejected due to incomplete information and missing photos.',
  },
  {
    id: 5,
    requesterId: 1,
    reviewerId: null,
    objectType: 'Property',
    objectId: 301,
    status: 'pending',
    requestedAt: new Date('2025-05-09T08:00:00'),
    completedAt: null,
    priority: 'medium',
    notes: 'Need a second opinion on the property condition assessment.',
  },
];

export const mockComments: Comment[] = [
  {
    id: 1,
    userId: 2,
    objectType: 'AppraisalReport',
    objectId: 101,
    content: 'The comparable properties selected are not in the same market area. Please revise.',
    createdAt: new Date('2025-05-07T11:30:00'),
    updatedAt: new Date('2025-05-07T11:30:00'),
    threadId: null,
    parentId: null,
  },
  {
    id: 2,
    userId: 1,
    objectType: 'AppraisalReport',
    objectId: 101,
    content: 'I\'ve updated the comparable properties to be within the same neighborhood.',
    createdAt: new Date('2025-05-07T13:45:00'),
    updatedAt: new Date('2025-05-07T13:45:00'),
    threadId: 1,
    parentId: 1,
  },
  {
    id: 3,
    userId: 2,
    objectType: 'AppraisalReport',
    objectId: 101,
    content: 'The market conditions adjustment needs more supporting data.',
    createdAt: new Date('2025-05-08T09:15:00'),
    updatedAt: new Date('2025-05-08T09:15:00'),
    threadId: null,
    parentId: null,
  },
  {
    id: 4,
    userId: 3,
    objectType: 'Comparable',
    objectId: 201,
    content: 'This comparable is too old to be relevant to current market conditions.',
    createdAt: new Date('2025-05-06T10:30:00'),
    updatedAt: new Date('2025-05-06T10:30:00'),
    threadId: null,
    parentId: null,
  },
];

export const mockAnnotations: Annotation[] = [
  {
    id: 1,
    userId: 2,
    objectType: 'AppraisalReport',
    objectId: 101,
    content: 'The condition rating here is inconsistent with the property photos.',
    createdAt: new Date('2025-05-07T11:45:00'),
    updatedAt: new Date('2025-05-07T11:45:00'),
    annotationType: 'correction',
    position: 'page-3-paragraph-2',
  },
  {
    id: 2,
    userId: 2,
    objectType: 'AppraisalReport',
    objectId: 101,
    content: 'The site measurement calculations appear to be incorrect.',
    createdAt: new Date('2025-05-07T12:15:00'),
    updatedAt: new Date('2025-05-07T12:15:00'),
    annotationType: 'error',
    position: 'page-5-table-1',
  },
  {
    id: 3,
    userId: 1,
    objectType: 'Comparable',
    objectId: 201,
    content: 'This adjustment calculation is based on the wrong formula.',
    createdAt: new Date('2025-05-06T14:30:00'),
    updatedAt: new Date('2025-05-06T14:30:00'),
    annotationType: 'error',
    position: 'adjustment-table-row-3',
  },
];

export const mockRevisionHistory: RevisionHistory[] = [
  {
    id: 1,
    userId: 1,
    objectType: 'AppraisalReport',
    objectId: 101,
    revisionType: 'Update',
    revisionContent: 'Updated comparable properties to be within the same neighborhood.',
    createdAt: new Date('2025-05-07T13:45:00'),
    previousVersionId: null,
  },
  {
    id: 2,
    userId: 1,
    objectType: 'AppraisalReport',
    objectId: 101,
    revisionType: 'Correction',
    revisionContent: 'Corrected condition rating to match property photos.',
    createdAt: new Date('2025-05-07T15:20:00'),
    previousVersionId: 1,
  },
  {
    id: 3,
    userId: 1,
    objectType: 'AppraisalReport',
    objectId: 101,
    revisionType: 'Addition',
    revisionContent: 'Added supporting data for market conditions adjustment.',
    createdAt: new Date('2025-05-08T10:30:00'),
    previousVersionId: 2,
  },
];

// Mock service functions to simulate API calls
export const getReviewRequests = async (): Promise<ReviewRequest[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockReviewRequests;
};

export const getReviewRequestById = async (id: number): Promise<ReviewRequest | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockReviewRequests.find(request => request.id === id);
};

export const getCommentsByObject = async (objectType: string, objectId: number): Promise<Comment[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockComments.filter(comment => 
    comment.objectType === objectType && comment.objectId === objectId
  );
};

export const getAnnotationsByObject = async (objectType: string, objectId: number): Promise<Annotation[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockAnnotations.filter(annotation => 
    annotation.objectType === objectType && annotation.objectId === objectId
  );
};

export const getRevisionHistoryByObject = async (objectType: string, objectId: number): Promise<RevisionHistory[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockRevisionHistory.filter(revision => 
    revision.objectType === objectType && revision.objectId === objectId
  );
};

export const updateReviewRequestStatus = async (id: number, status: string): Promise<ReviewRequest> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const request = mockReviewRequests.find(req => req.id === id);
  if (!request) {
    throw new Error(`Review request with ID ${id} not found`);
  }
  
  const updatedRequest = {
    ...request,
    status: status as 'pending' | 'in_progress' | 'completed' | 'rejected',
    completedAt: status === 'completed' ? new Date() : request.completedAt
  };
  
  // In a real implementation, we would update the data in the backend
  // Here we're just returning the updated object
  return updatedRequest;
};