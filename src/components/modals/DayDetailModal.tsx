import { useCourseStore } from '@/store/courseStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useDeadlineStore } from '@/store/deadlineStore';
import { parseDateParts, parseMinutes, localDateStr } from '@/utils/timeUtils';
import { getDayNumber } from '@/utils/courseUtils';
import { X, Trophy } from 'lucide-react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getPeriodInfo(startTime: string) {
  const mins = parseMinutes(startTime);
  if (mins < 720) return { label: '上午', color: '#d97706', bg: '#fef3c7' };
  if (mins < 1080) return { label: '下午', color: '#0284c7', bg: '#e0f2fe' };
  return { label: '晚上', color: '#7c3aed', bg: '#ede9fe' };
}

interface DayDetailModalProps {
  date: string;
  onCourseClick: (courseId: string) => void;
  onClose: () => void;
  filterUsername?: string;
}

export function DayDetailModal({ date, onCourseClick, onClose, filterUsername }: DayDetailModalProps) {
  const courses = useCourseStore(s => s.courses);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const allDeadlines = useDeadlineStore(s => s.deadlines);

  const allUsers = getAllUsers();
  const { month, day } = parseDateParts(date);
  const weekday = WEEKDAYS[new Date(date + 'T12:00:00').getDay()];

  const todayStr = localDateStr();
  const dayCourses = courses
    .filter(c =>
      c.date === date &&
      (!filterUsername || c.teacher === filterUsername || c.coTeachers?.includes(filterUsername))
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const deadlines = allDeadlines.filter(dl => dl.date === date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[480px] max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <div className="text-lg font-bold text-[#0f172a]">{month}月{day}日 · 周{weekday}</div>
            <div className="text-sm text-[#64748b]">{dayCourses.length} 节课</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>

        {/* Deadlines */}
        {deadlines.length > 0 && (
          <div className="px-4 pt-3 shrink-0 flex flex-col gap-2">
            {deadlines.map(dl => (
              <div key={dl.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <Trophy className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm font-semibold text-red-700">{dl.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Course list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          {dayCourses.length === 0 ? (
            <p className="text-center text-[#94a3b8] text-sm py-8">今天暂无排课</p>
          ) : (
            dayCourses.map(course => {
              const color = getTeacherColor(course.teacher);
              const { label: periodLabel, color: periodColor, bg: periodBg } = getPeriodInfo(course.startTime);
              const teacherUser = allUsers.find(u => u.username === course.teacher);
              const dayNum = getDayNumber(course.id, courses);
              const isCancelled = course.status === 'cancelled';
              const isCompleted = course.status === 'completed';
              const isPast = course.date < todayStr;
              const isPending = isPast && !isCompleted && !isCancelled;

              return (
                <button
                  key={course.id}
                  onClick={() => { onCourseClick(course.id); onClose(); }}
                  className="w-full text-left rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#e2e8f0] hover:border-[#cbd5e1] active:scale-[0.99]"
                >
                  <div className="flex items-stretch">
                    {/* Left teacher color bar */}
                    <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
                    {/* Content */}
                    <div className="flex-1 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: periodBg, color: periodColor }}
                        >
                          {periodLabel}
                        </span>
                        <span className="text-xs font-mono text-[#64748b]">
                          {course.startTime} – {course.endTime}
                        </span>
                      </div>
                      <div className={`text-sm font-bold text-[#0f172a] leading-snug${isCancelled ? ' line-through opacity-40' : ''}`}>
                        {course.teamName}
                      </div>
                      <div className={`text-sm text-[#475569] leading-snug${isCancelled ? ' line-through opacity-40' : ''}`}>
                        {course.courseName}
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                        <span className="text-xs text-[#94a3b8]">
                          {teacherUser?.displayName ?? course.teacher}
                          {(course.coTeachers?.length ?? 0) > 0 && ` +${course.coTeachers!.length}`}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-[#b0bec5]">Day {dayNum}</span>
                          {course.mode === 'online' && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">线上</span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ 完成</span>
                          )}
                          {isCancelled && (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">已取消</span>
                          )}
                          {isPending && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">待确认</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
