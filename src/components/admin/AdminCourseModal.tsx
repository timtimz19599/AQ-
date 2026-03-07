import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { Wifi, MapPin, X } from 'lucide-react';
import type { Course, CourseMode } from '@/types/course';
import { COURSE_NAME_OPTIONS } from '@/utils/courseUtils';

interface AdminCourseModalProps {
  course?: Course;          // undefined = add mode
  onClose: () => void;
}

export function AdminCourseModal({ course, onClose }: AdminCourseModalProps) {
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const addCourse = useCourseStore(s => s.addCourse);
  const updateCourse = useCourseStore(s => s.updateCourse);

  const teachers = getAllUsers().sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN'));
  const isEdit = !!course;

  const initialSelect = course
    ? (COURSE_NAME_OPTIONS.includes(course.courseName as typeof COURSE_NAME_OPTIONS[number]) ? course.courseName : '其他')
    : COURSE_NAME_OPTIONS[0];
  const initialCustom = initialSelect === '其他' ? (course?.courseName ?? '') : '';

  const [courseNameSelect, setCourseNameSelect] = useState(initialSelect);
  const [courseNameCustom, setCourseNameCustom] = useState(initialCustom);
  const [teacher, setTeacher] = useState(course?.teacher ?? (teachers[0]?.username ?? ''));
  const [coTeachers, setCoTeachers] = useState<string[]>(course?.coTeachers ?? []);
  const [form, setForm] = useState({
    teamName: course?.teamName ?? '',
    date: course?.date ?? new Date().toISOString().split('T')[0],
    startTime: course?.startTime ?? '09:00',
    endTime: course?.endTime ?? '10:00',
  });
  const [mode, setMode] = useState<CourseMode>(course?.mode ?? 'offline');
  const [error, setError] = useState('');

  const isCustom = courseNameSelect === '其他';
  const resolvedCourseName = isCustom ? courseNameCustom.trim() : courseNameSelect;
  const otherTeachers = teachers.filter(t => t.username !== teacher);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleCoTeacher(username: string) {
    setCoTeachers(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
  }

  // When primary teacher changes, remove them from coTeachers if present
  function handleTeacherChange(username: string) {
    setTeacher(username);
    setCoTeachers(prev => prev.filter(u => u !== username));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolvedCourseName || !form.teamName || !teacher || !form.date || !form.startTime || !form.endTime) {
      setError('请填写所有字段'); return;
    }
    if (form.startTime >= form.endTime) {
      setError('结束时间必须晚于开始时间'); return;
    }
    const data = {
      courseName: resolvedCourseName,
      teamName: form.teamName,
      teacher,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      mode,
      coTeachers: coTeachers.length > 0 ? coTeachers : undefined,
    };
    if (isEdit) {
      updateCourse(course!.id, data);
    } else {
      addCourse({ ...data, createdBy: 'admin' });
    }
    onClose();
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] text-sm w-full';

  return (
    <Modal title={isEdit ? '编辑课程' : '新增课程'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* Primary teacher */}
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-[#64748b]">授课教师</span>
          {teachers.length === 0 ? (
            <p className="text-xs text-red-500">暂无注册教师，请先注册教师账号</p>
          ) : (
            <select value={teacher} onChange={e => handleTeacherChange(e.target.value)} className={inputCls}>
              {teachers.map(t => (
                <option key={t.username} value={t.username}>{t.displayName} (@{t.username})</option>
              ))}
            </select>
          )}
        </div>

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
        {otherTeachers.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">共同授课老师 <span className="text-[#94a3b8]">（可选）</span></span>
            <div className="border border-[#e2e8f0] rounded-lg p-2 flex flex-col gap-1 max-h-28 overflow-y-auto">
              {otherTeachers.map(t => {
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
                  const t = otherTeachers.find(x => x.username === u);
                  return (
                    <span key={u} className="flex items-center gap-1 bg-[#1e3a5f]/10 text-[#1e3a5f] text-[10px] px-2 py-0.5 rounded-full">
                      {t?.displayName ?? u}
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
          <Button type="submit">{isEdit ? '保存修改' : '新增课程'}</Button>
        </div>
      </form>
    </Modal>
  );
}
