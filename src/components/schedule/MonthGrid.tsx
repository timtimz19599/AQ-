import type { DaySchedule } from '@/types/course';
import { DayColumn } from './DayColumn';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const TODAY = new Date().toISOString().split('T')[0];

interface MonthGridProps {
  weeks: (DaySchedule | null)[][];
  onCourseClick: (courseId: string) => void;
}

function EmptyMonthState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="18" width="60" height="52" rx="6" fill="#e2e8f0" />
        <rect x="10" y="18" width="60" height="16" rx="6" fill="#cbd5e1" />
        <rect x="10" y="26" width="60" height="8" fill="#cbd5e1" />
        <rect x="22" y="10" width="6" height="16" rx="3" fill="#94a3b8" />
        <rect x="52" y="10" width="6" height="16" rx="3" fill="#94a3b8" />
        <circle cx="57" cy="57" r="14" fill="#1e3a5f" />
        <rect x="56" y="50" width="2" height="14" rx="1" fill="white" />
        <rect x="50" y="56" width="14" height="2" rx="1" fill="white" />
      </svg>
      <p className="mt-4 text-[#0f172a] font-semibold text-base">本月暂无排课计划</p>
      <p className="mt-1 text-[#64748b] text-sm">点击「+ 添加课程」开始排课</p>
    </div>
  );
}

export function MonthGrid({ weeks, onCourseClick }: MonthGridProps) {
  const isEmpty = weeks.every(week => week.every(day => day === null || day.groups.length === 0));

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-sm font-medium text-[#64748b] py-1">{d}</div>
        ))}
      </div>
      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((day, di) =>
            day === null ? (
              <div key={di} className="border border-transparent rounded-lg min-h-[80px] bg-white/30" />
            ) : (
              <DayColumn
                key={day.date}
                schedule={day}
                isToday={day.date === TODAY}
                onCourseClick={onCourseClick}
              />
            )
          )}
        </div>
      ))}
      {isEmpty && <EmptyMonthState />}
    </div>
  );
}
