import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModificationRequest, RequestType, RequestStatus } from '@/types/request';
import type { Course } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { useCourseStore } from './courseStore';

interface RequestState {
  requests: ModificationRequest[];
  submitRequest: (
    courseId: string,
    requestType: RequestType,
    requesterUsername: string,
    proposed: ModificationRequest['proposed'],
    originalSnapshot: Course
  ) => void;
  approveRequest: (id: string, adminNote?: string) => void;
  rejectRequest: (id: string, adminNote?: string) => void;
  getRequestsByStatus: (status: RequestStatus) => ModificationRequest[];
  getPendingForCourse: (courseId: string) => ModificationRequest | undefined;
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      requests: [],

      submitRequest: (courseId, requestType, requesterUsername, proposed, originalSnapshot) => {
        const req: ModificationRequest = {
          id: uuidv4(),
          courseId,
          requestType,
          requesterUsername,
          requestedAt: Date.now(),
          status: 'pending',
          reviewedAt: null,
          adminNote: '',
          proposed,
          originalSnapshot,
        };
        set(s => ({ requests: [...s.requests, req] }));
      },

      approveRequest: (id, adminNote = '') => {
        const req = get().requests.find(r => r.id === id);
        if (!req || req.status !== 'pending') return;

        if (req.requestType === 'delete') {
          useCourseStore.getState().deleteCourse(req.courseId);
        } else if (req.requestType === 'modify') {
          useCourseStore.getState().updateCourse(req.courseId, req.proposed);
        }

        set(s => ({
          requests: s.requests.map(r =>
            r.id === id ? { ...r, status: 'approved', reviewedAt: Date.now(), adminNote } : r
          ),
        }));
      },

      rejectRequest: (id, adminNote = '') => {
        set(s => ({
          requests: s.requests.map(r =>
            r.id === id ? { ...r, status: 'rejected', reviewedAt: Date.now(), adminNote } : r
          ),
        }));
      },

      getRequestsByStatus: (status) => {
        return get().requests.filter(r => r.status === status);
      },

      getPendingForCourse: (courseId) => {
        return get().requests.find(r => r.courseId === courseId && r.status === 'pending');
      },
    }),
    { name: 'aq_requests' }
  )
);
