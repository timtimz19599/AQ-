import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/utils/supabase';
import { useToastStore } from './toastStore';

export interface CompetitionDeadline {
  id: string;
  date: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: number;
}

interface DeadlineState {
  deadlines: CompetitionDeadline[];
  loading: boolean;
  init: () => Promise<void>;
  addDeadline: (data: Omit<CompetitionDeadline, 'id' | 'createdAt'>) => void;
  updateDeadline: (id: string, data: Partial<Pick<CompetitionDeadline, 'date' | 'title' | 'description'>>) => void;
  deleteDeadline: (id: string) => void;
}

export const useDeadlineStore = create<DeadlineState>()((set) => ({
  deadlines: [],
  loading: false,

  init: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('AQDeadline').select('*').order('createdAt', { ascending: false });
    if (error) {
      set({ loading: false });
      useToastStore.getState().add('截止日期数据加载失败，请刷新页面重试');
      return;
    }
    set({ deadlines: (data as CompetitionDeadline[]) ?? [], loading: false });
  },

  addDeadline: (data) => {
    const deadline: CompetitionDeadline = { ...data, id: uuidv4(), createdAt: Date.now() };
    set(s => ({ deadlines: [deadline, ...s.deadlines] }));
    supabase.from('AQDeadline').insert([deadline]).then(({ error }) => {
      if (error) useToastStore.getState().add('添加截止日期失败，该记录可能未保存');
    });
  },

  updateDeadline: (id, data) => {
    set(s => ({ deadlines: s.deadlines.map(d => d.id === id ? { ...d, ...data } : d) }));
    supabase.from('AQDeadline').update(data).eq('id', id).then(({ error }) => {
      if (error) useToastStore.getState().add('更新截止日期失败，修改可能未保存');
    });
  },

  deleteDeadline: (id) => {
    set(s => ({ deadlines: s.deadlines.filter(d => d.id !== id) }));
    supabase.from('AQDeadline').delete().eq('id', id).then(({ error }) => {
      if (error) useToastStore.getState().add('删除截止日期失败，请重试');
    });
  },
}));
