import { useState, useMemo } from 'react';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getDayNumber } from '@/utils/courseUtils';
import { Button } from '@/components/common/Button';
import { AdminCourseModal } from './AdminCourseModal';
import type { Course } from '@/types/course';
import { Plus, Pencil, Trash2, Wifi, MapPin, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'completed' | 'cancelled';

export function CoursesTab() {
  const courses = useCourseStore(s => s.courses);
  const deleteCourse = useCourseStore(s => s.deleteCourse);
  const cancelCourse = useCourseStore(s => s.cancelCourse);
  const completeCourse = useCourseStore(s => s.completeCourse);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const allUsers = getAllUsers();
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let base = [...courses].sort((a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    );
    if (filterTeacher) {
      base = base.filter(c =>
        c.teacher === filterTeacher || (c.coTeachers ?? []).includes(filterTeacher)
      );
    }
    if (filterStatus === 'pending') {
      base = base.filter(c => c.date < todayStr && c.status !== 'completed' && c.status !== 'cancelled');
    } else if (filterStatus === 'completed') {
      base = base.filter(c => c.status === 'completed');
    } else if (filterStatus === 'cancelled') {
      base = base.filter(c => c.status === 'cancelled');
    }
    return base;
  }, [courses, filterTeacher, filterStatus, todayStr]);

  // Count per status tab
  const counts = useMemo(() => {
    const all = courses.filter(c => !filterTeacher || c.teacher === filterTeacher || (c.coTeachers ?? []).includes(filterTeacher));
    return {
      all: all.length,
      pending: all.filter(c => c.date < todayStr && c.status !== 'completed' && c.status !== 'cancelled').length,
      completed: all.filter(c => c.status === 'completed').length,
      cancelled: all.filter(c => c.status === 'cancelled').length,
    };
  }, [courses, filterTeacher, todayStr]);

  function getDisplayName(username: string) {
    return allUsers.find(u => u.username === username)?.displayName ?? username;
  }

  const statusTabs: { key: StatusFilter; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认', icon: <AlertCircle className="w-3 h-3 text-orange-500" /> },
    { key: 'completed', label: '已完成', icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
    { key: 'cancelled', label: '已取消', icon: <XCircle className="w-3 h-3 text-slate-400" /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filterTeacher}
            onChange={e => setFilterTeacher(e.target.value)}
            className="border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/40"
          >
            <option value="">全部教师</option>
            {allUsers.map(u => (
              <option key={u.username} value={u.username}>{u.displayName}</option>
            ))}
          </select>
          <span className="text-xs text-[#64748b]">共 {filtered.length} 节课</span>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 inline mr-1" />新增课程
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-[#e2e8f0] pb-0">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
              filterStatus === tab.key
                ? 'border-[#1e3a5f] text-[#1e3a5f] bg-[#1e3a5f]/5'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filterStatus === tab.key ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' : 'bg-[#f1f5f9] text-[#94a3b8]'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Course list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-[#64748b] text-sm">暂无课程数据</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(course => {
            const color = getTeacherColor(course.teacher);
            const dayNum = getDayNumber(course.id, courses);
            const coTeachers = course.coTeachers ?? [];
            const isOnline = (course.mode ?? 'offline') === 'online';
            const isCancelled = course.status === 'cancelled';
            const isCompleted = course.status === 'completed';
            const isPending = course.date < todayStr && !isCompleted && !isCancelled;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-xl border flex items-stretch overflow-hidden${isCancelled ? ' opacity-60' : ''}${
                  isPending ? ' border-orange-300' : ' border-[#e2e8f0]'
                }`}
              >
                {/* Color strip */}
                <div className="w-1 shrink-0" style={{ backgroundColor: isCancelled ? '#94a3b8' : color }} />

                <div className="flex-1 px-4 py-3 flex items-center gap-4 min-w-0">
                  {/* Day badge */}
                  <div className="shrink-0 text-center">
                    <div className="text-[10px] text-[#64748b]">Day</div>
                    <div className={`text-lg font-bold leading-tight${isCancelled ? ' text-[#94a3b8] line-through' : ' text-[#1e3a5f]'}`}>{dayNum}</div>
                  </div>

                  <div className="h-8 w-px bg-[#e2e8f0] shrink-0" />

                  {/* Course info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm truncate${isCancelled ? ' text-[#94a3b8] line-through' : ' text-[#0f172a]'}`}>{course.teamName}</span>
                      <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-full shrink-0">{course.courseName}</span>
                      {isOnline
                        ? <span className="flex items-center gap-0.5 text-[10px] bg-[#f59e0b] text-white px-1.5 py-0.5 rounded-full shrink-0"><Wifi className="w-2.5 h-2.5" />线上</span>
                        : <span className="flex items-center gap-0.5 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shrink-0"><MapPin className="w-2.5 h-2.5" />线下</span>
                      }
                      {/* Status chips */}
                      {isPending && <span className="flex items-center gap-0.5 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full shrink-0"><AlertCircle className="w-2.5 h-2.5" />待确认</span>}
                      {isCompleted && <span className="flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0"><CheckCircle2 className="w-2.5 h-2.5" />已完成</span>}
                      {isCancelled && <span className="flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0"><XCircle className="w-2.5 h-2.5" />已取消</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#64748b] flex-wrap">
                      <span>{course.date} · {course.startTime}–{course.endTime}</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: isCancelled ? '#94a3b8' : color }} />
                        {getDisplayName(course.teacher)}
                        {coTeachers.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[#94a3b8]">
                            <Users className="w-3 h-3" />
                            {coTeachers.map(u => getDisplayName(u)).join('、')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 px-3 shrink-0">
                  {/* Admin can mark status */}
                  {isPending && (
                    <>
                      <button
                        onClick={() => completeCourse(course.id, { contentSummary: '（管理员标记）', attendance: '—', submittedAt: Date.now() })}
                        title="标记为已完成"
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => cancelCourse(course.id)}
                        title="标记为已取消"
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setEditing(course)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(course.id)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <p className="font-semibold text-[#0f172a]">确认删除此课程？</p>
            <p className="text-sm text-[#64748b]">此操作无法撤销。</p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>取消</Button>
              <Button variant="danger" onClick={() => { deleteCourse(confirmDelete); setConfirmDelete(null); }}>删除</Button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AdminCourseModal onClose={() => setShowAdd(false)} />}
      {editing && <AdminCourseModal course={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
