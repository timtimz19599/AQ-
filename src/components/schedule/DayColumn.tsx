import type { DaySchedule, Course } from '@/types/course';
import { parseDateParts, parseMinutes, localDateStr } from '@/utils/timeUtils';
import { Sun, Sunset, Moon, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CompactCourseCard } from './CompactCourseCard';
import { useDeadlineStore } from '@/store/deadlineStore';
import { useSettingsStore } from '@/store/settingsStore';

type Period = 'morning' | 'afternoon' | 'evening';

const PERIODS: { key: Period; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { key: 'morning',   label: '上午', Icon: Sun,    color: '#d97706', bg: 'rgba(245,158,11,0.08)'  },
  { key: 'afternoon', label: '下午', Icon: Sunset,  color: '#0284c7', bg: 'rgba(14,165,233,0.08)'  },
  { key: 'evening',   label: '晚上', Icon: Moon,   color: '#7c3aed', bg: 'rgba(139,92,246,0.08)'  },
];

function getCoursePeriod(course: Course): Period {
  const mins = parseMinutes(course.startTime);
  if (mins < 720) return 'morning';
  if (mins < 1080) return 'afternoon';
  return 'evening';
}

interface DayColumnProps {
  schedule: DaySchedule;
  isToday: boolean;
  onCourseClick: (courseId: string) => void;
}

export function DayColumn({ schedule, isToday, onCourseClick }: DayColumnProps) {
  const { day } = parseDateParts(schedule.date);
  const allDeadlines = useDeadlineStore(s => s.deadlines);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const deadlines = allDeadlines.filter(d => d.date === schedule.date);
  const hasDeadline = deadlines.length > 0;

  // Flatten all courses from all overlap groups, then group by period
  const byPeriod: Record<Period, Course[]> = { morning: [], afternoon: [], evening: [] };
  for (const group of schedule.groups) {
    for (const slot of group.slots) {
      byPeriod[getCoursePeriod(slot.course)].push(slot.course);
    }
  }
  // Sort each period's courses by start time
  for (const p of PERIODS) {
    byPeriod[p.key].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const activePeriods = PERIODS.filter(p => byPeriod[p.key].length > 0);
  const allCourses = PERIODS.flatMap(p => byPeriod[p.key]);

  return (
    <div className={`border rounded-lg flex flex-col overflow-hidden ${
      hasDeadline ? 'border-red-400 ring-1 ring-red-300' :
      isToday ? 'border-[#1e3a5f] bg-blue-50/40' : 'border-[#e2e8f0] bg-white'
    } ${hasDeadline ? 'bg-red-50/40' : ''}`}>
      {/* Day number */}
      <div className="text-center py-1 shrink-0">
        <span className={isToday
          ? 'bg-[#1e3a5f] text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs font-bold'
          : 'text-[#64748b] text-sm font-semibold'
        }>
          {day}
        </span>
      </div>

      {/* Deadline badge */}
      {hasDeadline && (
        <div className="mx-0.5 mb-0.5">
          {deadlines.map(d => (
            <div key={d.id} className="flex items-center gap-0.5 bg-red-500 text-white rounded px-1 py-0.5">
              <Trophy className="w-2.5 h-2.5 shrink-0" />
              <span className="text-[8px] font-bold leading-tight truncate">{d.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mobile: colored dots per course */}
      <div className="md:hidden flex flex-wrap gap-0.5 p-1 min-h-[40px] items-start content-start">
        {allCourses.map(course => (
          <span
            key={course.id}
            className="w-2.5 h-2.5 rounded-full cursor-pointer flex-shrink-0 hover:opacity-75 active:opacity-60"
            style={{ backgroundColor: getTeacherColor(course.teacher) }}
            onClick={(e) => { e.stopPropagation(); onCourseClick(course.id); }}
          />
        ))}
      </div>

      {/* Desktop: full period sections */}
      <div className="hidden md:flex flex-col min-h-[60px]">
        {activePeriods.map((p, i) => {
          const { Icon } = p;
          return (
            <div
              key={p.key}
              className={`flex flex-col${i > 0 ? ' border-t border-[#e2e8f0]' : ''}`}
            >
              {/* Period header */}
              <div
                className="flex items-center gap-1 px-1.5 py-[3px]"
                style={{ background: p.bg, borderLeft: `3px solid ${p.color}` }}
              >
                <Icon className="w-3 h-3 shrink-0" style={{ color: p.color }} />
                <span className="text-[11px] font-bold leading-none tracking-wide" style={{ color: p.color }}>
                  {p.label}
                </span>
                <span className="text-[9px] text-[#94a3b8] ml-auto">{byPeriod[p.key].length}节</span>
              </div>

              {/* Courses – stacked vertically, one per row */}
              <div className="flex flex-col gap-0.5 p-0.5">
                {byPeriod[p.key].map(course => (
                  <CompactCourseCard
                    key={course.id}
                    course={course}
                    onClick={() => onCourseClick(course.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
