import type { Course } from '@/types/course';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { darkenColor } from '@/utils/colorUtils';
import { getDayNumber } from '@/utils/courseUtils';

interface CompactCourseCardProps {
  course: Course;
  onClick: () => void;
}

export function CompactCourseCard({ course, onClick }: CompactCourseCardProps) {
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const courses = useCourseStore(s => s.courses);

  const color = getTeacherColor(course.teacher);
  const dark = darkenColor(color, 0.28);
  const isOnline = course.mode === 'online';
  const todayStr = new Date().toISOString().split('T')[0];
  const status = course.status;
  const isPast = course.date < todayStr;
  const isPending = isPast && status !== 'completed' && status !== 'cancelled';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  // Main body bg — derived from primary teacher color (darkened for contrast)
  let bg: string;
  if (isCancelled || isCompleted) {
    bg = '#475569';
  } else if (isPending) {
    bg = '#b45309';
  } else {
    bg = dark;
  }

  const allUsers = getAllUsers();
  const allTeachers = [course.teacher, ...(course.coTeachers ?? [])].map(username => ({
    name: allUsers.find(u => u.username === username)?.displayName ?? username,
    color: getTeacherColor(username),
  }));
  const dayNum = getDayNumber(course.id, courses);

  return (
    <div
      onClick={onClick}
      className={`rounded cursor-pointer flex items-stretch overflow-hidden text-white hover:opacity-90 transition-opacity${isCancelled ? ' opacity-50' : ''}`}
      style={{ background: bg }}
    >
      {/* Left teacher sidebar(s) — one strip per teacher */}
      {allTeachers.map((t, i) => (
        <div
          key={i}
          className="w-5 shrink-0 flex items-center justify-center py-1"
          style={{ backgroundColor: isCancelled || isCompleted ? '#94a3b8' : isPending ? '#d97706' : t.color }}
        >
          <span
            className="text-[9px] font-bold text-white select-none leading-tight"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {t.name}
          </span>
        </div>
      ))}

      {/* Main content */}
      <div className="flex-1 min-w-0 py-1 px-1.5">
        <div className="text-[10px] font-semibold opacity-70 leading-tight">
          Day {dayNum} · {course.startTime}–{course.endTime}
        </div>
        <div className={`text-[12px] font-bold leading-tight truncate${isCancelled ? ' line-through' : ''}`}>
          {course.teamName}
        </div>
        <div className={`text-[11px] leading-tight truncate opacity-85${isCancelled ? ' line-through' : ''}`}>
          {course.courseName}
        </div>
        {isPending && (
          <div className="text-[9px] font-semibold bg-white/25 rounded px-0.5 mt-0.5 inline-block leading-tight">
            待确认
          </div>
        )}
        {isCompleted && (
          <div className="text-[9px] font-semibold opacity-80 leading-tight">✓ 完成</div>
        )}
      </div>

      {/* Right online strip – only shown when online */}
      {isOnline && !isCancelled && (
        <div className="shrink-0 w-4 flex items-center justify-center bg-amber-400/80">
          <span
            className="text-[8px] font-bold text-white select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            线上
          </span>
        </div>
      )}
    </div>
  );
}
