import type { DaySchedule, OverlapGroup } from '@/types/course';
import { OverlapRow } from './OverlapRow';
import { parseDateParts, parseMinutes } from '@/utils/timeUtils';
import { Sun, Sunset, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DayColumnProps {
  schedule: DaySchedule;
  isToday: boolean;
  onCourseClick: (courseId: string) => void;
}

type Period = 'morning' | 'afternoon' | 'evening';

const PERIODS: { key: Period; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { key: 'morning',   label: '上午', Icon: Sun,    color: '#d97706', bg: 'rgba(245,158,11,0.08)'  },
  { key: 'afternoon', label: '下午', Icon: Sunset,  color: '#0284c7', bg: 'rgba(14,165,233,0.08)'  },
  { key: 'evening',   label: '晚上', Icon: Moon,   color: '#7c3aed', bg: 'rgba(139,92,246,0.08)'  },
];

function getGroupPeriod(group: OverlapGroup): Period {
  const mins = parseMinutes(group.slots[0].course.startTime);
  if (mins < 720)  return 'morning';
  if (mins < 1080) return 'afternoon';
  return 'evening';
}

export function DayColumn({ schedule, isToday, onCourseClick }: DayColumnProps) {
  const { day } = parseDateParts(schedule.date);

  const byPeriod: Record<Period, OverlapGroup[]> = { morning: [], afternoon: [], evening: [] };
  for (const group of schedule.groups) {
    byPeriod[getGroupPeriod(group)].push(group);
  }
  const activePeriods = PERIODS.filter(p => byPeriod[p.key].length > 0);

  return (
    <div className={`border rounded-lg flex flex-col overflow-hidden ${
      isToday ? 'border-[#1e3a5f] bg-blue-50/40' : 'border-[#e2e8f0] bg-white'
    }`}>
      {/* Day number */}
      <div className="text-center py-1 shrink-0">
        <span className={isToday
          ? 'bg-[#1e3a5f] text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-bold'
          : 'text-[#64748b] text-sm font-semibold'
        }>
          {day}
        </span>
      </div>

      {/* Time period sections */}
      <div className="flex flex-col min-h-[60px]">
        {activePeriods.map((p, i) => {
          const { Icon } = p;
          return (
            <div
              key={p.key}
              className={`flex flex-col ${i > 0 ? 'border-t border-[#e2e8f0]' : ''}`}
            >
              {/* Period header */}
              <div
                className="flex items-center gap-1 px-1.5 py-[3px]"
                style={{
                  background: p.bg,
                  borderLeft: `3px solid ${p.color}`,
                }}
              >
                <Icon className="w-3 h-3 shrink-0" style={{ color: p.color }} />
                <span
                  className="text-[11px] font-bold leading-none tracking-wide"
                  style={{ color: p.color }}
                >
                  {p.label}
                </span>
              </div>

              {/* Courses */}
              <div className="flex flex-col gap-0.5 p-0.5">
                {byPeriod[p.key].map((group, gi) => (
                  <OverlapRow key={gi} group={group} onCourseClick={onCourseClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
