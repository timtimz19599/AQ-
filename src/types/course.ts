export type CourseMode = 'online' | 'offline';

export interface Course {
  id: string;
  courseName: string;
  teamName: string;
  teacher: string;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  mode: CourseMode;
  coTeachers?: string[];
  createdAt: number;
  createdBy: string;
}

export interface LayoutSlot {
  course: Course;
  columnIndex: number;
  totalColumns: number;
}

export interface OverlapGroup {
  slots: LayoutSlot[];
}

export interface DaySchedule {
  date: string;
  groups: OverlapGroup[];
}
