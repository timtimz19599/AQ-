export type CourseMode = 'online' | 'offline';

export type CourseStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CourseFeedback {
  contentSummary: string;  // 内容简述
  attendance: string;      // 学生出勤情况
  submittedAt: number;     // 时间戳
}

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
  status?: CourseStatus;      // undefined 视同 'scheduled'
  feedback?: CourseFeedback;
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
