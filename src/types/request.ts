import type { Course } from './course';

export type RequestType = 'modify' | 'delete';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ModificationRequest {
  id: string;
  courseId: string;
  requestType: RequestType;
  requesterUsername: string;
  requestedAt: number;
  status: RequestStatus;
  reviewedAt: number | null;
  adminNote: string;
  proposed: Partial<Omit<Course, 'id' | 'createdAt' | 'createdBy'>>;
  originalSnapshot: Course;
}
