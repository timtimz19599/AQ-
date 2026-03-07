import { create } from 'zustand';
import type { ModificationRequest, RequestType, RequestStatus } from '@/types/request';
import type { Course } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { useCourseStore } from './courseStore';
import { supabase } from '@/utils/supabase';
import { useToastStore } from './toastStore';

interface RequestState {
  requests: ModificationRequest[];
  loading: boolean;
  init: () => Promise<void>;
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

export const useRequestStore = create<RequestState>()((set, get) => ({
  requests: [],
  loading: false,

  init: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('AQRequest').select('*').order('requestedAt', { ascending: false });
    if (error) {
      set({ loading: false });
      useToastStore.getState().add('申请数据加载失败，请刷新页面重试');
      return;
    }
    set({ requests: (data as ModificationRequest[]) ?? [], loading: false });
  },

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
    set(s => ({ requests: [req, ...s.requests] }));
    supabase.from('AQRequest').insert([req]).then(({ error }) => {
      if (error) useToastStore.getState().add('提交申请失败，该申请可能未保存');
    });
  },

  approveRequest: (id, adminNote = '') => {
    const req = get().requests.find(r => r.id === id);
    if (!req || req.status !== 'pending') return;

    if (req.requestType === 'delete') {
      useCourseStore.getState().deleteCourse(req.courseId);
    } else if (req.requestType === 'modify') {
      useCourseStore.getState().updateCourse(req.courseId, req.proposed);
    }

    const update = { status: 'approved' as RequestStatus, reviewedAt: Date.now(), adminNote };
    set(s => ({
      requests: s.requests.map(r => r.id === id ? { ...r, ...update } : r),
    }));
    supabase.from('AQRequest').update(update).eq('id', id).then(({ error }) => {
      if (error) useToastStore.getState().add('审批操作失败，请重试');
    });
  },

  rejectRequest: (id, adminNote = '') => {
    const update = { status: 'rejected' as RequestStatus, reviewedAt: Date.now(), adminNote };
    set(s => ({
      requests: s.requests.map(r => r.id === id ? { ...r, ...update } : r),
    }));
    supabase.from('AQRequest').update(update).eq('id', id).then(({ error }) => {
      if (error) useToastStore.getState().add('拒绝操作失败，请重试');
    });
  },

  getRequestsByStatus: (status) => get().requests.filter(r => r.status === status),

  getPendingForCourse: (courseId) => get().requests.find(r => r.courseId === courseId && r.status === 'pending'),
}));
