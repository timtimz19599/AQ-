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

  // Status logic
  const todayStr = new Date().toISOString().split('T')[0];
  const isPast = course.date < todayStr;
  const status = course.status;
  const isPending = isPast && status !== 'completed' && status !== 'cancelled';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  // Color scheme: completed=gray, pending=amber, cancelled=gray+dim, future=teacher color
  let bgGradient: string;
  let textColor: string;
  let boxShadow: string;
  if (isCancelled) {
    bgGradient = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    textColor = '#fff';
    boxShadow = '0 2px 6px #94a3b844';
  } else if (isCompleted) {
    bgGradient = 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    textColor = '#fff';
    boxShadow = '0 2px 6px #94a3b844';
  } else if (isPending) {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    textColor = '#fff';
    boxShadow = '0 2px 8px #f59e0b55';
  } else {
    bgGradient = `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`;
    textColor = fg;
    boxShadow = `0 2px 8px ${base}55`;
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shrink-0 flex relative${isCancelled ? ' opacity-50' : ''}`}
      style={{
        background: bgGradient,
        color: textColor,
        width: widthPct,
        minWidth: 0,
        boxShadow,
      }}
    >
      {/* Left accent bar */}
      <div className="w-0.5 shrink-0 bg-white/40" />

      {/* Main content */}
      <div className="flex-1 min-w-0 p-1.5 flex flex-col gap-0">
        <div className="text-xs font-light truncate opacity-80">{course.startTime}–{course.endTime}</div>
        <div className={`text-xs font-bold truncate${isCancelled ? ' line-through' : ''}`}>Day {dayNum}</div>
        <div className={`text-xs truncate opacity-90${isCancelled ? ' line-through' : ''}`}>{course.teamName}</div>
        <div className={`text-xs truncate opacity-75${isCancelled ? ' line-through' : ''}`}>{course.courseName}</div>
        {isPending && <div className="text-[9px] font-semibold opacity-80 mt-0.5">待确认</div>}

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
      {isOnline && !isCancelled && (
        <div className="flex items-center justify-center shrink-0 w-5 bg-[#f59e0b]">
          <span
            className="text-[9px] font-bold text-white tracking-widest select-none"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Online
          </span>
        </div>
      )}

      {/* Completed ✓ badge */}
      {isCompleted && (
        <div className="absolute top-0.5 right-0.5 bg-white/30 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          ✓
        </div>
      )}
    </div>
  );
}
