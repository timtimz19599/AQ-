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

/** Returns the 1-based Day number for a course, sorted globally by date then startTime. */
export function getDayNumber(courseId: string, courses: Course[]): number {
  const sorted = [...courses].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
  });
  const idx = sorted.findIndex(c => c.id === courseId);
  return idx === -1 ? 0 : idx + 1;
}
