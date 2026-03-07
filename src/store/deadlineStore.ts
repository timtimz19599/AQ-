import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface CompetitionDeadline {
  id: string;
  date: string;        // YYYY-MM-DD
  title: string;
  description?: string;
  createdBy: string;
  createdAt: number;
}

interface DeadlineState {
  deadlines: CompetitionDeadline[];
  addDeadline: (data: Omit<CompetitionDeadline, 'id' | 'createdAt'>) => void;
  updateDeadline: (id: string, data: Partial<Pick<CompetitionDeadline, 'date' | 'title' | 'description'>>) => void;
  deleteDeadline: (id: string) => void;
}

export const useDeadlineStore = create<DeadlineState>()(
  persist(
    (set) => ({
      deadlines: [],

      addDeadline: (data) => {
        set(s => ({ deadlines: [...s.deadlines, { ...data, id: uuidv4(), createdAt: Date.now() }] }));
      },

      updateDeadline: (id, data) => {
        set(s => ({ deadlines: s.deadlines.map(d => d.id === id ? { ...d, ...data } : d) }));
      },

      deleteDeadline: (id) => {
        set(s => ({ deadlines: s.deadlines.filter(d => d.id !== id) }));
      },
    }),
    { name: 'aq_deadlines' }
  )
);
