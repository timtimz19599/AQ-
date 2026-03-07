import { useMemo } from 'react';
import type { DaySchedule } from '@/types/course';
import { useCourseStore } from '@/store/courseStore';
import { buildDaySchedule } from '@/utils/overlapLayout';

// Returns 7 DaySchedule items (Sun–Sat) starting from weekStart
export function useWeekGrid(
  weekStart: Date,
  filterUsername?: string,
  approvedUsernames?: string[],
): DaySchedule[] {
  const courses = useCourseStore(s => s.courses);

  return useMemo(() => {
    const days: DaySchedule[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let dayCourses = courses.filter(c => c.date === dateStr);
      if (filterUsername) {
        dayCourses = dayCourses.filter(c =>
          c.teacher === filterUsername || (c.coTeachers ?? []).includes(filterUsername)
        );
      } else if (approvedUsernames) {
        dayCourses = dayCourses.filter(c => approvedUsernames.includes(c.teacher));
      }
      days.push(buildDaySchedule(dateStr, dayCourses));
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, courses, filterUsername, approvedUsernames]);
}
