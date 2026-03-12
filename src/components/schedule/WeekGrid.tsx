import type { DaySchedule, Course } from '@/types/course';
import { parseDateParts, parseMinutes, localDateStr } from '@/utils/timeUtils';
import { darkenColor } from '@/utils/colorUtils';
import { useDeadlineStore } from '@/store/deadlineStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { Sun, Sunset, Moon, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const TODAY = localDateStr();

type Period = 'morning' | 'afternoon' | 'evening';

const PERIODS: { key: Period; label: string; Icon: LucideIcon; color: string; bg: string }[] = [
  { key: 'morning',   label: '上午', Icon: Sun,    color: '#d97706', bg: 'rgba(245,158,11,0.06)'  },
  { key: 'afternoon', label: '下午', Icon: Sunset,  color: '#0284c7', bg: 'rgba(14,165,233,0.06)'  },
  { key: 'evening',   label: '晚上', Icon: Moon,   color: '#7c3aed', bg: 'rgba(139,92,246,0.06)'  },
];

function getCoursePeriod(course: Course): Period {
  const mins = parseMinutes(course.startTime);
  if (mins < 720) return 'morning';
  if (mins < 1080) return 'afternoon';
  return 'evening';
}

// Larger course card for week view — shows full info without truncation
interface WeekCourseCardProps {
  course: Course;
  onClick: () => void;
}

function WeekCourseCard({ course, onClick }: WeekCourseCardProps) {
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const todayStr = localDateStr();

  const color = getTeacherColor(course.teacher);
  const dark = darkenColor(color, 0.25);
  const allUsers = getAllUsers();
  const teacherUser = allUsers.find(u => u.username === course.teacher);

  const isCancelled = course.status === 'cancelled';
  const isCompleted = course.status === 'completed';
  const isPast = course.date < todayStr;
  const isPending = isPast && !isCompleted && !isCancelled;

  let borderColor = color;
  let bg = 'white';
  if (isPending)  { borderColor = '#d97706'; bg = '#fffbeb'; }
  if (isCompleted){ borderColor = '#94a3b8'; bg = '#f8fafc'; }
  if (isCancelled){ borderColor = '#cbd5e1'; bg = '#f8fafc'; }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded overflow-hidden border hover:brightness-95 transition-all active:scale-[0.99]${isCancelled ? ' opacity-50' : ''}`}
      style={{ borderColor, backgroundColor: bg }}
    >
      <div className="flex items-stretch">
        {/* Left teacher color bar */}
        <div
          className="w-0.5 shrink-0"
          style={{ backgroundColor: isCancelled || isCompleted ? '#94a3b8' : isPending ? '#d97706' : dark }}
        />
        {/* Card content */}
        <div className="flex-1 px-1.5 py-1 min-w-0">
          <div className="text-[9px] font-mono text-[#a0aec0] leading-tight">
            {course.startTime}–{course.endTime}
          </div>
          <div className={`text-[11px] font-bold text-[#0f172a] leading-tight${isCancelled ? ' line-through' : ''}`}>
            {course.teamName}
          </div>
          <div className={`text-[10px] text-[#64748b] leading-tight${isCancelled ? ' line-through' : ''}`}>
            {course.courseName}
          </div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[9px] text-[#a0aec0] truncate">
              {teacherUser?.displayName ?? course.teacher}
              {(course.coTeachers?.length ?? 0) > 0 && ` +${course.coTeachers!.length}`}
            </span>
            {course.mode === 'online' && !isCancelled && (
              <span className="text-[8px] font-bold bg-amber-100 text-amber-600 px-1 rounded-full">线上</span>
            )}
            {isCompleted && (
              <span className="text-[8px] font-bold bg-emerald-100 text-emerald-600 px-1 rounded-full">✓</span>
            )}
            {isCancelled && (
              <span className="text-[8px] font-bold bg-gray-100 text-gray-400 px-1 rounded-full">取消</span>
            )}
            {isPending && (
              <span className="text-[8px] font-bold bg-amber-100 text-amber-600 px-1 rounded-full">待确认</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

interface WeekGridProps {
  days: DaySchedule[];
  onCourseClick: (courseId: string) => void;
  onDayClick: (date: string) => void;
}

export function WeekGrid({ days, onCourseClick, onDayClick }: WeekGridProps) {
  const isEmpty = days.every(d => d.groups.length === 0);
  const allDeadlines = useDeadlineStore(s => s.deadlines);

  // Pre-compute each day's courses grouped by period
  const daysByPeriod = days.map(day => {
    const byPeriod: Record<Period, Course[]> = { morning: [], afternoon: [], evening: [] };
    for (const group of day.groups) {
      for (const slot of group.slots) {
        byPeriod[getCoursePeriod(slot.course)].push(slot.course);
      }
    }
    for (const p of PERIODS) {
      byPeriod[p.key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return { date: day.date, byPeriod };
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ width: 'max-content', minWidth: '100%' }}>

        {/* Day header row — each day column is 150px fixed */}
        <div
          className="grid bg-[#f8fafc] border-b border-[#e2e8f0]"
          style={{ gridTemplateColumns: '36px repeat(7, 150px)' }}
        >
          <div className="border-r border-[#e2e8f0]" />
          {days.map((day, i) => {
            const { month, day: d } = parseDateParts(day.date);
            const isToday = day.date === TODAY;
            const dayDeadlines = allDeadlines.filter(dl => dl.date === day.date);
            const hasDeadline = dayDeadlines.length > 0;
            return (
              <button
                key={day.date}
                onClick={() => onDayClick(day.date)}
                className={`text-center py-2.5 transition-colors hover:bg-[#f1f5f9] ${
                  i < 6 ? 'border-r border-[#e2e8f0]' : ''
                } ${hasDeadline ? 'bg-red-50' : isToday ? 'bg-blue-50/60' : ''}`}
              >
                <div className="text-xs font-medium text-[#64748b]">{WEEKDAYS[i]}</div>
                <div className={`mt-1 mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  isToday ? 'bg-[#1e3a5f] text-white' : 'text-[#0f172a]'
                }`}>
                  {d}
                </div>
                <div className="text-[10px] text-[#94a3b8] mt-0.5">{month}月</div>
                {hasDeadline && (
                  <div className="mx-1 mt-1 flex flex-col gap-0.5">
                    {dayDeadlines.slice(0, 1).map(dl => (
                      <div key={dl.id} className="flex items-center justify-center gap-0.5 bg-red-500 text-white rounded px-1 py-0.5">
                        <Trophy className="w-2.5 h-2.5 shrink-0" />
                        <span className="text-[8px] font-bold truncate">{dl.title}</span>
                      </div>
                    ))}
                    {dayDeadlines.length > 1 && (
                      <span className="text-[8px] text-red-500 font-bold">+{dayDeadlines.length - 1}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Period rows — only render a period row if at least one day has courses in it */}
        {PERIODS.map((period, pi) => {
          const { Icon } = period;
          const anyHasCourses = daysByPeriod.some(d => d.byPeriod[period.key].length > 0);
          if (!anyHasCourses) return null;

          return (
            <div
              key={period.key}
              className={`grid${pi < PERIODS.length - 1 ? ' border-b border-[#e2e8f0]' : ''}`}
              style={{ gridTemplateColumns: '36px repeat(7, 150px)' }}
            >
              {/* Period label column */}
              <div
                className="flex flex-col items-center justify-center gap-1 py-2 shrink-0"
                style={{ background: period.bg, borderRight: `2px solid ${period.color}` }}
              >
                <Icon className="w-3 h-3 shrink-0" style={{ color: period.color }} />
                <span
                  className="text-[9px] font-bold leading-none"
                  style={{ color: period.color, writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {period.label}
                </span>
              </div>

              {/* Day cells */}
              {daysByPeriod.map((day, i) => {
                const courses = day.byPeriod[period.key];
                const isToday = day.date === TODAY;
                return (
                  <div
                    key={day.date}
                    className={`p-1 flex flex-col gap-1${i < 6 ? ' border-r border-[#e2e8f0]' : ''}${isToday ? ' bg-blue-50/20' : ''}`}
                  >
                    {courses.map(course => (
                      <WeekCourseCard
                        key={course.id}
                        course={course}
                        onClick={() => onCourseClick(course.id)}
                      />
                    ))}
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
    </div>
  );
}
