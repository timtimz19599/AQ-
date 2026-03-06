import type { DaySchedule } from '@/types/course';
import { OverlapRow } from './OverlapRow';
import { parseDateParts } from '@/utils/timeUtils';

interface DayColumnProps {
  schedule: DaySchedule;
  isToday: boolean;
  onCourseClick: (courseId: string) => void;
}

export function DayColumn({ schedule, isToday, onCourseClick }: DayColumnProps) {
  const { day } = parseDateParts(schedule.date);
  const hasCourses = schedule.groups.length > 0;

  return (
    <div className={`border rounded-lg min-h-[80px] flex flex-col ${
      isToday ? 'border-[#1e3a5f] bg-blue-50/60' : 'border-[#e2e8f0] bg-white'
    }`}>
      <div className="text-center py-1 text-sm font-semibold">
        <span className={isToday
          ? 'bg-[#1e3a5f] text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs'
          : 'text-[#64748b]'
        }>
          {day}
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-0.5 p-0.5 overflow-hidden">
        {hasCourses
          ? schedule.groups.map((group, i) => (
              <OverlapRow key={i} group={group} onCourseClick={onCourseClick} />
            ))
          : null}
      </div>
    </div>
  );
}
