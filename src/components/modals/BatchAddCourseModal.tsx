import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { Wifi, MapPin, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { CourseMode } from '@/types/course';
import { COURSE_NAME_OPTIONS, findConflict } from '@/utils/courseUtils';
import { localDateStr } from '@/utils/timeUtils';
import { v4 as uuidv4 } from 'uuid';

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: CourseMode;
}

interface BatchAddCourseModalProps {
  onClose: () => void;
}

export function BatchAddCourseModal({ onClose }: BatchAddCourseModalProps) {
  const session = useAuthStore(s => s.session)!;
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const addCourse = useCourseStore(s => s.addCourse);
  const courses = useCourseStore(s => s.courses);

  const allTeachers = getAllUsers();
  const isAdmin = session.role === 'admin';
  const today = localDateStr();

  // Shared fields
  const [courseNameSelect, setCourseNameSelect] = useState<string>(COURSE_NAME_OPTIONS[0]);
  const [courseNameCustom, setCourseNameCustom] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teacher, setTeacher] = useState(isAdmin ? (allTeachers[0]?.username ?? '') : session.username);
  const [coTeachers, setCoTeachers] = useState<string[]>([]);

  // Sessions list
  const [sessions, setSessions] = useState<Session[]>([
    { id: uuidv4(), date: today, startTime: '09:00', endTime: '10:00', mode: 'offline' },
  ]);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');

  const isCustom = courseNameSelect === '其他';
  const resolvedCourseName = isCustom ? courseNameCustom.trim() : courseNameSelect;
  const otherTeachers = allTeachers.filter(t => t.username !== teacher);

  function addSession() {
    const last = sessions[sessions.length - 1];
    setSessions(prev => [...prev, {
      id: uuidv4(),
      date: last?.date ?? today,
      startTime: last?.startTime ?? '09:00',
      endTime: last?.endTime ?? '10:00',
      mode: last?.mode ?? 'offline',
    }]);
  }

  function removeSession(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  function updateSession(id: string, field: keyof Omit<Session, 'id'>, value: string) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function toggleCoTeacher(username: string) {
    setCoTeachers(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
  }

  function handleTeacherChange(username: string) {
    setTeacher(username);
    setCoTeachers(prev => prev.filter(u => u !== username));
  }

  function doAddAll() {
    for (const s of sessions) {
      addCourse({
        courseName: resolvedCourseName,
        teamName: teamName.trim(),
        teacher: isAdmin ? teacher : session.username,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        mode: s.mode,
        coTeachers: coTeachers.length > 0 ? coTeachers : undefined,
        createdBy: session.username,
      });
    }
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConflictWarning('');
    if (!resolvedCourseName) { setError('请填写课程名称'); return; }
    if (!teamName.trim()) { setError('请填写队伍名称'); return; }
    if (sessions.length === 0) { setError('请至少添加一个课次'); return; }
    for (const s of sessions) {
      if (!s.date || !s.startTime || !s.endTime) { setError('请填写所有课次的日期和时间'); return; }
      if (s.startTime >= s.endTime) { setError('结束时间必须晚于开始时间'); return; }
    }

    const targetTeacher = isAdmin ? teacher : session.username;
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      // 批次内课次互相冲突（硬性错误，不允许绕过）
      for (let j = 0; j < i; j++) {
        const other = sessions[j];
        if (other.date === s.date && other.startTime < s.endTime && s.startTime < other.endTime) {
          setError(`第 ${j + 1} 节与第 ${i + 1} 节时间重叠，请检查`); return;
        }
      }
      // 与已有课程冲突（可二次确认绕过）
      const conflict = findConflict(courses, targetTeacher, s.date, s.startTime, s.endTime);
      if (conflict) {
        setConflictWarning(`第 ${i + 1} 节：该老师在此时段已有课程「${conflict.teamName}」${conflict.startTime}–${conflict.endTime}`);
        return;
      }
    }

    doAddAll();
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] text-sm w-full bg-white';

  return (
    <Modal title="一键排课 · 批量添加" onClose={onClose} width="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Shared course info */}
        <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0] flex flex-col gap-3">
          <div className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">课程基本信息（所有课次共用）</div>

          {/* Teacher – admin only */}
          {isAdmin && (
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">授课教师</span>
              {allTeachers.length === 0 ? (
                <p className="text-xs text-red-500">暂无注册教师</p>
              ) : (
                <select value={teacher} onChange={e => handleTeacherChange(e.target.value)} className={inputCls}>
                  {allTeachers.map(t => (
                    <option key={t.username} value={t.username}>{t.displayName} (@{t.username})</option>
                  ))}
                </select>
              )}
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
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[#64748b]">学校 / 队伍名称</span>
            <input value={teamName} onChange={e => setTeamName(e.target.value)}
              className={inputCls} placeholder="如 Alpha Quants A队" />
          </div>

          {/* Co-teachers */}
          {otherTeachers.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">共同授课老师 <span className="text-[#94a3b8]">（可选）</span></span>
              <div className="border border-[#e2e8f0] rounded-lg p-2 flex flex-col gap-1 max-h-24 overflow-y-auto bg-white">
                {otherTeachers.map(t => {
                  const checked = coTeachers.includes(t.username);
                  return (
                    <label key={t.username} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleCoTeacher(t.username)}
                        className="accent-[#1e3a5f] w-3.5 h-3.5" />
                      <span className="text-xs text-[#0f172a]">{t.displayName}</span>
                      <span className="text-[10px] text-[#94a3b8]">@{t.username}</span>
                    </label>
                  );
                })}
              </div>
              {coTeachers.length > 0 && (
                <div className="flex flex-wrap gap-1">
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
        </div>

        {/* Sessions list */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
              课次安排
              <span className="ml-1.5 text-[#94a3b8] font-normal normal-case">共 {sessions.length} 节</span>
            </div>
            <button
              type="button"
              onClick={addSession}
              className="flex items-center gap-1 text-xs text-[#1e3a5f] font-medium bg-[#1e3a5f]/10 hover:bg-[#1e3a5f]/20 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />添加课次
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-0.5">
            {sessions.map((s, i) => (
              <div key={s.id} className="border border-[#e2e8f0] rounded-xl p-3 bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748b]">第 {i + 1} 节</span>
                  {sessions.length > 1 && (
                    <button type="button" onClick={() => removeSession(s.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date */}
                <input type="date" value={s.date}
                  onChange={e => updateSession(s.id, 'date', e.target.value)}
                  className={inputCls} />

                {/* Time */}
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-[#64748b]">开始时间</span>
                    <input type="time" value={s.startTime}
                      onChange={e => updateSession(s.id, 'startTime', e.target.value)}
                      className={inputCls} />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-xs text-[#64748b]">结束时间</span>
                    <input type="time" value={s.endTime}
                      onChange={e => updateSession(s.id, 'endTime', e.target.value)}
                      className={inputCls} />
                  </div>
                </div>

                {/* Mode – per session */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSession(s.id, 'mode', 'offline')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      s.mode === 'offline'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />线下
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSession(s.id, 'mode', 'online')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      s.mode === 'online'
                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                        : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" />线上
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {conflictWarning ? (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">时间冲突提醒</p>
                <p className="text-xs text-amber-700 mt-0.5">{conflictWarning}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setConflictWarning('')}>重新选择时间</Button>
              <Button type="button" onClick={doAddAll}>仍然全部添加</Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit">批量添加 {sessions.length} 节课</Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
