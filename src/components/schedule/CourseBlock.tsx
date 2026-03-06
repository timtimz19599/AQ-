import type { LayoutSlot } from '@/types/course';
import { useSettingsStore } from '@/store/settingsStore';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { getTextColor, darkenColor } from '@/utils/colorUtils';
import { getDayNumber } from '@/utils/courseUtils';

interface CourseBlockProps {
  slot: LayoutSlot;
  onClick: () => void;
}

export function CourseBlock({ slot, onClick }: CourseBlockProps) {
  const { course, totalColumns } = slot;
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const courses = useCourseStore(s => s.courses);
  const getAllUsers = useAuthStore(s => s.getAllUsers);

  const base = getTeacherColor(course.teacher);
  const dark = darkenColor(base, 0.28);
  const fg = getTextColor(base);
  const widthPct = `${100 / totalColumns}%`;
  const isOnline = (course.mode ?? 'offline') === 'online';
  const dayNum = getDayNumber(course.id, courses);

  // Resolve display names
  const allUsers = getAllUsers();
  function displayName(username: string) {
    return allUsers.find(u => u.username === username)?.displayName ?? username;
  }
  const primaryName = displayName(course.teacher);
  const coNames = (course.coTeachers ?? []).map(displayName);
  const allTeacherNames = [primaryName, ...coNames];
  const hasCoTeacher = coNames.length > 0;

  return (
    <div
      onClick={onClick}
      className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shrink-0 flex"
      style={{
        background: `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
        color: fg,
        width: widthPct,
        minWidth: 0,
        boxShadow: `0 2px 8px ${base}55`,
      }}
    >
      {/* Left accent bar */}
      <div className="w-0.5 shrink-0 bg-white/40" />

      {/* Main content */}
      <div className="flex-1 min-w-0 p-1.5 flex flex-col gap-0">
        <div className="text-xs font-light truncate opacity-80">{course.startTime}–{course.endTime}</div>
        <div className="text-xs font-bold truncate">Day {dayNum}</div>
        <div className="text-xs truncate opacity-90">{course.teamName}</div>
        <div className="text-xs truncate opacity-75">{course.courseName}</div>

        {/* Teacher name(s) */}
        <div className="mt-0.5 pt-0.5 border-t border-white/20">
          {hasCoTeacher ? (
            <div className="flex flex-col gap-0">
              {allTeacherNames.map((name, i) => (
                <div key={i} className="text-[10px] truncate opacity-70 leading-tight">
                  {i === 0 ? name : `· ${name}`}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[10px] truncate opacity-70">{primaryName}</div>
          )}
        </div>
      </div>

      {/* Online side strip */}
      {isOnline && (
        <div className="flex items-center justify-center shrink-0 w-5 bg-[#f59e0b]">
          <span
            className="text-[9px] font-bold text-white tracking-widest select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Online
          </span>
        </div>
      )}
    </div>
  );
}
