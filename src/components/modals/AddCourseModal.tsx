import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { Wifi, MapPin, X } from 'lucide-react';
import type { Course, CourseMode } from '@/types/course';
import { COURSE_NAME_OPTIONS } from '@/utils/courseUtils';

interface AddCourseModalProps {
  initialDate?: string;
  initialValues?: Partial<Course>;
  onAfterAdd?: () => void;
  onClose: () => void;
}

export function AddCourseModal({ initialDate, initialValues, onAfterAdd, onClose }: AddCourseModalProps) {
  const session = useAuthStore(s => s.session)!;
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const addCourse = useCourseStore(s => s.addCourse);

  const today = new Date().toISOString().split('T')[0];
  const allTeachers = getAllUsers().filter(u => u.username !== session.username)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN'));

  // Resolve initial courseName selection
  const initCourseName = initialValues?.courseName ?? COURSE_NAME_OPTIONS[0];
  const isKnown = (COURSE_NAME_OPTIONS as readonly string[]).includes(initCourseName) && initCourseName !== '其他';
  const [courseNameSelect, setCourseNameSelect] = useState<string>(isKnown ? initCourseName : '其他');
  const [courseNameCustom, setCourseNameCustom] = useState(isKnown ? '' : initCourseName);

  const [form, setForm] = useState({
    teamName: initialValues?.teamName ?? '',
    date: initialValues?.date ?? initialDate ?? today,
    startTime: initialValues?.startTime ?? '09:00',
    endTime: initialValues?.endTime ?? '10:00',
  });
  const [mode, setMode] = useState<CourseMode>(initialValues?.mode ?? 'offline');
  const [coTeachers, setCoTeachers] = useState<string[]>(initialValues?.coTeachers ?? []);
  const [error, setError] = useState('');

  const isCustom = courseNameSelect === '其他';
  const resolvedCourseName = isCustom ? courseNameCustom.trim() : courseNameSelect;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleCoTeacher(username: string) {
    setCoTeachers(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedCourseName || !form.teamName || !form.date || !form.startTime || !form.endTime) {
      setError('请填写所有字段'); return;
    }
    if (form.startTime >= form.endTime) {
      setError('结束时间必须晚于开始时间'); return;
    }
    addCourse({
      courseName: resolvedCourseName,
      teamName: form.teamName,
      teacher: session.username,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      mode,
      coTeachers: coTeachers.length > 0 ? coTeachers : undefined,
      createdBy: session.username,
    });
    onAfterAdd?.();
    onClose();
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] text-sm w-full';

  return (
    <Modal title={initialValues ? '调课 · 新排课程' : '添加课程'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {initialValues && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            提交后将自动取消原课程。请修改日期或时间后提交。
          </div>
        )}

        {/* Course name */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">课程名称</span>
          <select value={courseNameSelect} onChange={e => setCourseNameSelect(e.target.value)} className={inputCls}>
            {COURSE_NAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {isCustom && (
            <input value={courseNameCustom} onChange={e => setCourseNameCustom(e.target.value)}
              className={inputCls} placeholder="请输入课程名称" autoFocus />
          )}
        </div>

        {/* Team name */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">学校 / 队伍名称</span>
          <input name="teamName" value={form.teamName} onChange={handleChange}
            className={inputCls} placeholder="如 Alpha Quants A队" />
        </label>

        {/* Date & time */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">日期</span>
          <input type="date" name="date" value={form.date} onChange={handleChange} className={inputCls} />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 text-sm flex-1">
            <span className="text-[#64748b]">开始时间</span>
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1">
            <span className="text-[#64748b]">结束时间</span>
            <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className={inputCls} />
          </label>
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">上课形式</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('offline')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${mode === 'offline' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'}`}>
              <MapPin className="w-4 h-4" />线下
            </button>
            <button type="button" onClick={() => setMode('online')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${mode === 'online' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'}`}>
              <Wifi className="w-4 h-4" />线上
            </button>
          </div>
        </div>

        {/* Co-teachers */}
        {allTeachers.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">共同授课老师 <span className="text-[#94a3b8]">（可选）</span></span>
            <div className="border border-[#e2e8f0] rounded-lg p-2 flex flex-col gap-1 max-h-28 overflow-y-auto">
              {allTeachers.map(t => {
                const checked = coTeachers.includes(t.username);
                return (
                  <label key={t.username} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleCoTeacher(t.username)}
                      className="accent-[#1e3a5f] w-3.5 h-3.5" />
                    <span className="text-[#0f172a] text-xs">{t.displayName}</span>
                    <span className="text-[#94a3b8] text-[10px]">@{t.username}</span>
                  </label>
                );
              })}
            </div>
            {coTeachers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {coTeachers.map(u => {
                  const teacher = allTeachers.find(t => t.username === u);
                  return (
                    <span key={u} className="flex items-center gap-1 bg-[#1e3a5f]/10 text-[#1e3a5f] text-[10px] px-2 py-0.5 rounded-full">
                      {teacher?.displayName ?? u}
                      <button type="button" onClick={() => toggleCoTeacher(u)}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
          <Button type="submit">{initialValues ? '提交新课程' : '添加'}</Button>
        </div>
      </form>
    </Modal>
  );
}
