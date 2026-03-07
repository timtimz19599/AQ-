import { create } from 'zustand';
import type { Course, CourseFeedback } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from './settingsStore';
import { supabase } from '@/utils/supabase';

interface CourseState {
  courses: Course[];
  loading: boolean;
  init: () => Promise<void>;
  addCourse: (data: Omit<Course, 'id' | 'createdAt'>) => Course;
  updateCourse: (id: string, data: Partial<Omit<Course, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteCourse: (id: string) => void;
  completeCourse: (id: string, feedback: CourseFeedback) => void;
  cancelCourse: (id: string) => void;
  getCoursesByMonth: (year: number, month: number) => Course[];
  getCoursesByDate: (date: string) => Course[];
  getCourseById: (id: string) => Course | undefined;
}

export const useCourseStore = create<CourseState>()((set, get) => ({
  courses: [],
  loading: false,

  init: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('AQCourse')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ courses: (data as Course[]) ?? [], loading: false });
  },

  addCourse: (data) => {
    const course: Course = { ...data, id: uuidv4(), createdAt: Date.now() };
    useSettingsStore.getState().ensureTeacherColor(data.teacher);
    set(s => ({ courses: [course, ...s.courses] }));
    supabase.from('AQCourse').insert([{ ...course, createTime: new Date().toISOString() }]).then(({ error }) => {
      if (error) console.error('新增课程同步失败：', error.message);
    });
    return course;
  },

  updateCourse: (id, data) => {
    set(s => ({ courses: s.courses.map(c => c.id === id ? { ...c, ...data } : c) }));
    supabase.from('AQCourse').update(data).eq('id', id).then(({ error }) => {
      if (error) console.error('更新课程同步失败：', error.message);
    });
  },

  deleteCourse: (id) => {
    set(s => ({ courses: s.courses.filter(c => c.id !== id) }));
    supabase.from('AQCourse').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('删除课程同步失败：', error.message);
    });
  },

  completeCourse: (id, feedback) => {
    set(s => ({
      courses: s.courses.map(c => c.id === id ? { ...c, status: 'completed', feedback } : c),
    }));
    supabase.from('AQCourse').update({ status: 'completed', feedback }).eq('id', id).then(({ error }) => {
      if (error) console.error('完成课程同步失败：', error.message);
    });
  },

  cancelCourse: (id) => {
    set(s => ({ courses: s.courses.map(c => c.id === id ? { ...c, status: 'cancelled' } : c) }));
    supabase.from('AQCourse').update({ status: 'cancelled' }).eq('id', id).then(({ error }) => {
      if (error) console.error('取消课程同步失败：', error.message);
    });
  },

  getCoursesByMonth: (year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return get().courses.filter(c => c.date.startsWith(prefix));
  },

  getCoursesByDate: (date) => get().courses.filter(c => c.date === date),

  getCourseById: (id) => get().courses.find(c => c.id === id),
}));
