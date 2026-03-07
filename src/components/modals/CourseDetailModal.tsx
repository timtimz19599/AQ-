import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getTextColor, darkenColor } from '@/utils/colorUtils';
import { getDayNumber } from '@/utils/courseUtils';
import { localDateStr } from '@/utils/timeUtils';
import { Wifi, MapPin, Clock, CalendarDays, User, Users, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { EditCourseModal } from './EditCourseModal';
import { AddCourseModal } from './AddCourseModal';

interface CourseDetailModalProps {
  courseId: string;
  onClose: () => void;
}

export function CourseDetailModal({ courseId, onClose }: CourseDetailModalProps) {
  const course = useCourseStore(s => s.getCourseById(courseId));
  const courses = useCourseStore(s => s.courses);
  const deleteCourse = useCourseStore(s => s.deleteCourse);
  const completeCourse = useCourseStore(s => s.completeCourse);
  const cancelCourse = useCourseStore(s => s.cancelCourse);
  const session = useAuthStore(s => s.session);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);

  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackAttendance, setFeedbackAttendance] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);

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

  // Status logic
  const todayStr = localDateStr();
  const isPast = course.date < todayStr;
  const isToday = course.date === todayStr;
  const isFuture = course.date > todayStr;
  const canConfirm = isPast || isToday; // 今天和过去都可以提交反馈
  const status = course.status;
  const isPending = (isPast || isToday) && status !== 'completed' && status !== 'cancelled';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  function handleSubmitFeedback() {
    if (!feedbackContent.trim() || !feedbackAttendance.trim()) return;
    completeCourse(course!.id, {
      contentSummary: feedbackContent.trim(),
      attendance: feedbackAttendance.trim(),
      submittedAt: Date.now(),
    });
    setShowFeedbackForm(false);
  }

  function handleRescheduleComplete() {
    cancelCourse(course!.id);
    onClose();
  }

  if (showEdit) {
    return <EditCourseModal course={course} onClose={() => { setShowEdit(false); onClose(); }} />;
  }

  if (showReschedule) {
    return (
      <AddCourseModal
        initialValues={course}
        onAfterAdd={handleRescheduleComplete}
        onClose={() => setShowReschedule(false)}
      />
    );
  }

  return (
    <Modal title="课程详情" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Gradient header card */}
        <div
          className={`rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden${isCancelled ? ' opacity-60' : ''}`}
          style={{
            background: isCancelled
              ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
              : `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
            color: isCancelled ? '#fff' : fg,
            boxShadow: isCancelled ? undefined : `0 4px 16px ${base}44`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-semibold opacity-70 tracking-wide">Day {dayNum}</div>
              <div className={`text-lg font-bold leading-tight${isCancelled ? ' line-through' : ''}`}>{course.teamName}</div>
              <div className="text-sm opacity-85">{course.courseName}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {/* Mode badge */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                isOnline ? 'bg-sky-400/30 text-sky-100' : 'bg-emerald-400/30 text-emerald-100'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {isOnline ? '线上' : '线下'}
              </div>
              {/* Status badge */}
              {isCompleted && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/30 text-emerald-100">
                  <CheckCircle2 className="w-3 h-3" />已完成
                </div>
              )}
              {isCancelled && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white/80">
                  <XCircle className="w-3 h-3" />已取消
                </div>
              )}
              {isPending && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-400/40 text-orange-100">
                  ⚠ 待确认
                </div>
              )}
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

        {/* Completed: show feedback (read-only) */}
        {isCompleted && course.feedback && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              课堂反馈（已提交）
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <div>
                <span className="text-[#64748b] text-xs">内容简述：</span>
                <p className="text-[#0f172a] mt-0.5">{course.feedback.contentSummary}</p>
              </div>
              <div>
                <span className="text-[#64748b] text-xs">学生出勤：</span>
                <p className="text-[#0f172a] mt-0.5">{course.feedback.attendance}</p>
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                提交于 {new Date(course.feedback.submittedAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        )}

        {/* Pending: status confirmation banner */}
        {isPending && !showFeedbackForm && !isCompleted && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
            <p className="text-amber-700 text-sm font-medium">⚠ 此课程尚未确认，不计入课时统计</p>
          </div>
        )}

        {/* Feedback form (inline, expanded) */}
        {showFeedbackForm && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-3">
            <p className="text-emerald-700 text-sm font-semibold">填写课堂反馈</p>
            <div className="flex flex-col gap-1 text-sm">
              <label className="text-[#64748b] text-xs">内容简述</label>
              <textarea
                value={feedbackContent}
                onChange={e => setFeedbackContent(e.target.value)}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500 resize-y"
                rows={8}
                placeholder="本节课讲授的主要内容..."
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <label className="text-[#64748b] text-xs">学生出勤情况</label>
              <input
                value={feedbackAttendance}
                onChange={e => setFeedbackAttendance(e.target.value)}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-500"
                placeholder="如：全员出席 / 缺席1人"
              />
            </div>
            {(!feedbackContent.trim() || !feedbackAttendance.trim()) && (
              <p className="text-xs text-red-500">请填写所有字段</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowFeedbackForm(false)}>返回</Button>
              <Button
                onClick={handleSubmitFeedback}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...({} as any)}
              >
                提交并标记为已完成
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canEdit && !isCancelled && (
          confirmDelete ? (
            <div className="flex flex-col gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">确定要删除这节课吗？此操作无法撤销。</p>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>取消</Button>
                <Button variant="danger" onClick={() => { deleteCourse(course.id); onClose(); }}>确认删除</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end flex-wrap">
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>删除</Button>
              {canConfirm && !isCompleted && (
                <Button variant="secondary" onClick={() => cancelCourse(course.id)}>
                  <XCircle className="w-3.5 h-3.5 inline mr-1" />
                  取消课程
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowEdit(true)}>编辑课程</Button>
              {isFuture && !isCancelled && (
                <Button variant="secondary" onClick={() => setShowReschedule(true)}>
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                  调课
                </Button>
              )}
              {canConfirm && !isCompleted && (
                <Button onClick={() => setShowFeedbackForm(true)}>
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  填写课堂反馈
                </Button>
              )}
            </div>
          )
        )}

        {/* Cancelled: only allow delete */}
        {canEdit && isCancelled && (
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
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
