import type { Course } from '@/types/course';

export const COURSE_NAME_OPTIONS = [
  '财商课后课ASA',
  'BPA',
  'SIC',
  'Conrad Challenge',
  'WGHS',
  'Diamond Challenge',
  '其他',
] as const;

/**
 * 检查某老师在指定日期和时间段是否与现有课程冲突。
 * 返回第一个冲突的课程，若无冲突返回 undefined。
 * excludeId: 编辑时排除自身。
 */
export function findConflict(
  courses: Course[],
  teacherUsername: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Course | undefined {
  return courses.find(c =>
    c.id !== excludeId &&
    c.teacher === teacherUsername &&
    c.date === date &&
    c.status !== 'cancelled' &&
    c.startTime < endTime &&
    startTime < c.endTime,
  );
}

/**
 * Returns the 1-based Day number for a course within its own series.
 * A "series" is all courses sharing the same courseName + teamName,
 * sorted by date then startTime.
 * e.g. every Monday's "财商课后课ASA" for "Basis" → Day 1, Day 2, Day 3…
 */
export function getDayNumber(courseId: string, courses: Course[]): number {
  const course = courses.find(c => c.id === courseId);
  if (!course) return 0;
  const sameSeries = courses
    .filter(c => c.courseName === course.courseName && c.teamName === course.teamName)
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
    });
  const idx = sameSeries.findIndex(c => c.id === courseId);
  return idx === -1 ? 0 : idx + 1;
}
