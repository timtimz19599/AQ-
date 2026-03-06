import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getTextColor, darkenColor } from '@/utils/colorUtils';
import { getDayNumber } from '@/utils/courseUtils';
import { Wifi, MapPin, Clock, CalendarDays, User, Users } from 'lucide-react';
import { EditCourseModal } from './EditCourseModal';

interface CourseDetailModalProps {
  courseId: string;
  onClose: () => void;
}

export function CourseDetailModal({ courseId, onClose }: CourseDetailModalProps) {
  const course = useCourseStore(s => s.getCourseById(courseId));
  const courses = useCourseStore(s => s.courses);
  const deleteCourse = useCourseStore(s => s.deleteCourse);
  const session = useAuthStore(s => s.session);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!course) return null;

  const base = getTeacherColor(course.teacher);
  const dark = darkenColor(base, 0.28);
  const fg = getTextColor(base);
  const allUsers = getAllUsers();
  const coTeachers = (course.coTeachers ?? []).map(u => allUsers.find(t => t.username === u)?.displayName ?? u);
  const isCoTeacher = (course.coTeachers ?? []).includes(session?.username ?? '');
  const isOwner = session?.username === course.teacher || isCoTeacher;
  const isAdmin = session?.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const isOnline = (course.mode ?? 'offline') === 'online';
  const dayNum = getDayNumber(course.id, courses);

  if (showEdit) {
    return <EditCourseModal course={course} onClose={() => { setShowEdit(false); onClose(); }} />;
  }

  return (
    <Modal title="课程详情" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Gradient header card */}
        <div
          className="rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
            color: fg,
            boxShadow: `0 4px 16px ${base}44`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold opacity-70 tracking-wide">Day {dayNum}</div>
              <div className="text-lg font-bold leading-tight">{course.teamName}</div>
              <div className="text-sm opacity-85">{course.courseName}</div>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
              isOnline ? 'bg-sky-400/30 text-sky-100' : 'bg-emerald-400/30 text-emerald-100'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              {isOnline ? '线上' : '线下'}
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-1 border-t border-white/15 pt-2">
            <div className="flex items-center gap-1.5 text-sm opacity-85">
              <CalendarDays className="w-3.5 h-3.5" />
              {course.date}
            </div>
            <div className="flex items-center gap-1.5 text-sm opacity-85">
              <Clock className="w-3.5 h-3.5" />
              {course.startTime} – {course.endTime}
            </div>
            <div className="flex items-center gap-1.5 text-sm opacity-85">
              <User className="w-3.5 h-3.5" />
              {course.teacher}
            </div>
            <div className="flex items-center gap-1.5 text-sm opacity-85">
              <Users className="w-3.5 h-3.5" />
              {course.teamName}
            </div>
            {coTeachers.length > 0 && (
              <div className="flex items-start gap-1.5 text-sm opacity-85">
                <User className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>共同授课：{coTeachers.join('、')}</span>
              </div>
            )}
          </div>
        </div>

        {canEdit && (
          confirmDelete ? (
            <div className="flex flex-col gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">确定要删除这节课吗？此操作无法撤销。</p>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>取消</Button>
                <Button variant="danger" onClick={() => { deleteCourse(course.id); onClose(); }}>确认删除</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>删除</Button>
              <Button variant="secondary" onClick={() => setShowEdit(true)}>编辑课程</Button>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
