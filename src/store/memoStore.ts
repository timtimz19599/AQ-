import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Memo {
  id: string;
  teacher: string;      // username of creator
  teamName: string;
  content: string;
  status: 'pending' | 'done';
  createdAt: number;
}

interface MemoState {
  memos: Memo[];
  addMemo: (data: Omit<Memo, 'id' | 'createdAt'>) => void;
  updateMemo: (id: string, data: Partial<Pick<Memo, 'content' | 'status' | 'teamName'>>) => void;
  deleteMemo: (id: string) => void;
}

export const useMemoStore = create<MemoState>()(
  persist(
    (set) => ({
      memos: [],

      addMemo: (data) => {
        set(s => ({ memos: [...s.memos, { ...data, id: uuidv4(), createdAt: Date.now() }] }));
      },

      updateMemo: (id, data) => {
        set(s => ({ memos: s.memos.map(m => m.id === id ? { ...m, ...data } : m) }));
      },

      deleteMemo: (id) => {
        set(s => ({ memos: s.memos.filter(m => m.id !== id) }));
      },
    }),
    { name: 'aq_memos' }
  )
);
