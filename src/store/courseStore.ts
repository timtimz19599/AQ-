import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, CourseFeedback } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { useSettingsStore } from './settingsStore';

interface CourseState {
  courses: Course[];
  addCourse: (data: Omit<Course, 'id' | 'createdAt'>) => Course;
  updateCourse: (id: string, data: Partial<Omit<Course, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteCourse: (id: string) => void;
  completeCourse: (id: string, feedback: CourseFeedback) => void;
  cancelCourse: (id: string) => void;
  getCoursesByMonth: (year: number, month: number) => Course[];
  getCoursesByDate: (date: string) => Course[];
  getCourseById: (id: string) => Course | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: [],

      addCourse: (data) => {
        const course: Course = { ...data, id: uuidv4(), createdAt: Date.now() };
        useSettingsStore.getState().ensureTeacherColor(data.teacher);
        set(s => ({ courses: [...s.courses, course] }));
        return course;
      },

      updateCourse: (id, data) => {
        set(s => ({
          courses: s.courses.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deleteCourse: (id) => {
        set(s => ({ courses: s.courses.filter(c => c.id !== id) }));
      },

      completeCourse: (id, feedback) => {
        set(s => ({
          courses: s.courses.map(c =>
            c.id === id ? { ...c, status: 'completed', feedback } : c
          ),
        }));
      },

      cancelCourse: (id) => {
        set(s => ({
          courses: s.courses.map(c =>
            c.id === id ? { ...c, status: 'cancelled' } : c
          ),
        }));
      },

      getCoursesByMonth: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return get().courses.filter(c => c.date.startsWith(prefix));
      },

      getCoursesByDate: (date) => {
        return get().courses.filter(c => c.date === date);
      },

      getCourseById: (id) => {
        return get().courses.find(c => c.id === id);
      },
    }),
    { name: 'aq_courses' }
  )
);
