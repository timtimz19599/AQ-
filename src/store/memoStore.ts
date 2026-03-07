import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/utils/supabase';

export interface Memo {
  id: string;
  teacher: string;
  teamName: string;
  content: string;
  status: 'pending' | 'done';
  createdAt: number;
}

interface MemoState {
  memos: Memo[];
  loading: boolean;
  init: () => Promise<void>;
  addMemo: (data: Omit<Memo, 'id' | 'createdAt'>) => void;
  updateMemo: (id: string, data: Partial<Pick<Memo, 'content' | 'status' | 'teamName'>>) => void;
  deleteMemo: (id: string) => void;
}

export const useMemoStore = create<MemoState>()((set) => ({
  memos: [],
  loading: false,

  init: async () => {
    set({ loading: true });
    const { data } = await supabase.from('AQMemo').select('*').order('createdAt', { ascending: false });
    set({ memos: (data as Memo[]) ?? [], loading: false });
  },

  addMemo: (data) => {
    const memo: Memo = { ...data, id: uuidv4(), createdAt: Date.now() };
    set(s => ({ memos: [memo, ...s.memos] }));
    supabase.from('AQMemo').insert([memo]).then(({ error }) => {
      if (error) console.error('新增备忘录同步失败：', error.message);
    });
  },

  updateMemo: (id, data) => {
    set(s => ({ memos: s.memos.map(m => m.id === id ? { ...m, ...data } : m) }));
    supabase.from('AQMemo').update(data).eq('id', id).then(({ error }) => {
      if (error) console.error('更新备忘录同步失败：', error.message);
    });
  },

  deleteMemo: (id) => {
    set(s => ({ memos: s.memos.filter(m => m.id !== id) }));
    supabase.from('AQMemo').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('删除备忘录同步失败：', error.message);
    });
  },
}));
