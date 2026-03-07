import type { DaySchedule, OverlapGroup } from '@/types/course';
import { OverlapRow } from './OverlapRow';
import { parseDateParts, parseMinutes } from '@/utils/timeUtils';
import { Sun, Sunset, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Period = 'morning' | 'afternoon' | 'evening';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const TODAY = new Date().toISOString().split('T')[0];

const PERIODS: { key: Period; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { key: 'morning',   label: '上午', Icon: Sun,    color: '#d97706', bg: 'rgba(245,158,11,0.06)'  },
  { key: 'afternoon', label: '下午', Icon: Sunset,  color: '#0284c7', bg: 'rgba(14,165,233,0.06)'  },
  { key: 'evening',   label: '晚上', Icon: Moon,   color: '#7c3aed', bg: 'rgba(139,92,246,0.06)'  },
];

function getGroupPeriod(group: OverlapGroup): Period {
  const mins = parseMinutes(group.slots[0].course.startTime);
  if (mins < 720)  return 'morning';
  if (mins < 1080) return 'afternoon';
  return 'evening';
}

interface WeekGridProps {
  days: DaySchedule[];
  onCourseClick: (courseId: string) => void;
}

export function WeekGrid({ days, onCourseClick }: WeekGridProps) {
  const isEmpty = days.every(d => d.groups.length === 0);

  // Pre-compute each day's courses grouped by period
  const daysByPeriod = days.map(day => {
    const byPeriod: Record<Period, OverlapGroup[]> = { morning: [], afternoon: [], evening: [] };
    for (const group of day.groups) {
      byPeriod[getGroupPeriod(group)].push(group);
    }
    return { date: day.date, byPeriod };
  });

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-[#e2e8f0]">
      {/* Header row */}
      <div
        className="grid bg-[#f8fafc] border-b border-[#e2e8f0]"
        style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}
      >
        <div className="border-r border-[#e2e8f0]" />
        {days.map((day, i) => {
          const { month, day: d } = parseDateParts(day.date);
          const isToday = day.date === TODAY;
          return (
            <div
              key={day.date}
              className={`text-center py-2.5 ${i < 6 ? 'border-r border-[#e2e8f0]' : ''} ${isToday ? 'bg-blue-50/60' : ''}`}
            >
              <div className="text-xs font-medium text-[#64748b]">{WEEKDAYS[i]}</div>
              <div className={`mt-1 mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                isToday ? 'bg-[#1e3a5f] text-white' : 'text-[#0f172a]'
              }`}>
                {d}
              </div>
              <div className="text-[10px] text-[#94a3b8] mt-0.5">{month}月</div>
            </div>
          );
        })}
      </div>

      {/* Period rows */}
      {PERIODS.map((period, pi) => {
        const { Icon } = period;
        return (
          <div
            key={period.key}
            className={`grid ${pi < PERIODS.length - 1 ? 'border-b border-[#e2e8f0]' : ''}`}
            style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}
          >
            {/* Period label column */}
            <div
              className="flex flex-col items-center justify-center gap-1.5 py-3 border-r border-[#e2e8f0]"
              style={{ background: period.bg, borderRight: `3px solid ${period.color}` }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: period.color }} />
              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: period.color, writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                {period.label}
              </span>
            </div>

            {/* Day cells */}
            {daysByPeriod.map((day, i) => {
              const groups = day.byPeriod[period.key];
              const isToday = day.date === TODAY;
              return (
                <div
                  key={day.date}
                  className={`min-h-[90px] p-1.5 ${i < 6 ? 'border-r border-[#e2e8f0]' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}
                >
                  {groups.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {groups.map((group, gi) => (
                        <OverlapRow key={gi} group={group} onCourseClick={onCourseClick} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {isEmpty && (
        <div className="py-12 text-center text-[#94a3b8] text-sm">本周暂无排课计划</div>
      )}
    </div>
  );
}
