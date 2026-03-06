import { useMemo } from 'react';
import type { DaySchedule } from '@/types/course';
import { useCourseStore } from '@/store/courseStore';
import { buildDaySchedule } from '@/utils/overlapLayout';
import { getDaysInMonth, formatDate } from '@/utils/timeUtils';

// Returns a 2D array: weeks × 7 days, null for days outside the month
// If filterUsername is provided, only includes courses where that user is teacher or co-teacher
// If approvedUsernames is provided (admin view), only includes courses from those users
export function useMonthGrid(year: number, month: number, filterUsername?: string, approvedUsernames?: string[]): (DaySchedule | null)[][] {
  const getCoursesByMonth = useCourseStore(s => s.getCoursesByMonth);
  const courses = useCourseStore(s => s.courses);

  return useMemo(() => {
    let monthCourses = getCoursesByMonth(year, month);
    if (filterUsername) {
      monthCourses = monthCourses.filter(c =>
        c.teacher === filterUsername || (c.coTeachers ?? []).includes(filterUsername)
      );
    } else if (approvedUsernames) {
      monthCourses = monthCourses.filter(c => approvedUsernames.includes(c.teacher));
    }
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    const byDate = new Map<string, typeof monthCourses>();
    for (const course of monthCourses) {
      if (!byDate.has(course.date)) byDate.set(course.date, []);
      byDate.get(course.date)!.push(course);
    }

    const cells: (DaySchedule | null)[] = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const dayCourses = byDate.get(dateStr) ?? [];
      cells.push(buildDaySchedule(dateStr, dayCourses));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (DaySchedule | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, courses, filterUsername, approvedUsernames]);
}
