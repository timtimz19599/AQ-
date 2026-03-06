import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import type { Course, CourseMode } from '@/types/course';
import type { RequestType } from '@/types/request';
import { Wifi, MapPin } from 'lucide-react';
import { COURSE_NAME_OPTIONS } from '@/utils/courseUtils';

interface ModRequestModalProps {
  course: Course;
  onClose: () => void;
}

export function ModRequestModal({ course, onClose }: ModRequestModalProps) {
  const session = useAuthStore(s => s.session)!;
  const submitRequest = useRequestStore(s => s.submitRequest);
  const [requestType, setRequestType] = useState<RequestType>('modify');

  const initialSelect = COURSE_NAME_OPTIONS.includes(course.courseName as typeof COURSE_NAME_OPTIONS[number])
    ? course.courseName
    : '其他';
  const initialCustom = initialSelect === '其他' ? course.courseName : '';

  const [courseNameSelect, setCourseNameSelect] = useState<string>(initialSelect);
  const [courseNameCustom, setCourseNameCustom] = useState(initialCustom);
  const [form, setForm] = useState({
    teamName: course.teamName,
    date: course.date,
    startTime: course.startTime,
    endTime: course.endTime,
  });
  const [mode, setMode] = useState<CourseMode>(course.mode ?? 'offline');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isCustom = courseNameSelect === '其他';
  const resolvedCourseName = isCustom ? courseNameCustom.trim() : courseNameSelect;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestType === 'modify' && form.startTime >= form.endTime) {
      setError('结束时间必须晚于开始时间');
      return;
    }
    submitRequest(
      course.id,
      requestType,
      session.username,
      requestType === 'modify' ? { ...form, courseName: resolvedCourseName, mode } : {},
      course
    );
    setSubmitted(true);
  }

  const inputCls = 'border border-[#e2e8f0] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1e3a5f]/40 focus:border-[#1e3a5f] text-sm w-full';

  if (submitted) {
    return (
      <Modal title="申请已提交" onClose={onClose}>
        <p className="text-emerald-600 mb-4">您的申请已提交，等待管理员审核。</p>
        <div className="flex justify-end">
          <Button onClick={onClose}>关闭</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="申请修改/删除" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {(['modify', 'delete'] as RequestType[]).map(t => (
            <button key={t} type="button" onClick={() => setRequestType(t)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                requestType === t
                  ? t === 'delete'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-[#1e3a5f]/5 border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'
              }`}>
              {t === 'modify' ? '申请修改' : '申请删除'}
            </button>
          ))}
        </div>

        {requestType === 'modify' && (
          <>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">课程名称</span>
              <select value={courseNameSelect} onChange={e => setCourseNameSelect(e.target.value)} className={inputCls}>
                {COURSE_NAME_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {isCustom && (
                <input value={courseNameCustom} onChange={e => setCourseNameCustom(e.target.value)}
                  className={inputCls} placeholder="请输入课程名称" />
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">学校 / 队伍名称</span>
              <input name="teamName" value={form.teamName} onChange={handleChange} className={inputCls} />
            </label>

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

            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[#64748b]">上课形式</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMode('offline')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                    mode === 'offline' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'
                  }`}>
                  <MapPin className="w-4 h-4" />线下
                </button>
                <button type="button" onClick={() => setMode('online')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                    mode === 'online' ? 'bg-sky-50 border-sky-500 text-sky-700' : 'border-[#e2e8f0] text-[#64748b] hover:bg-gray-50'
                  }`}>
                  <Wifi className="w-4 h-4" />线上
                </button>
              </div>
            </div>
          </>
        )}

        {requestType === 'delete' && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            确认申请删除课程「{course.courseName}」（{course.teamName}）？此操作需要管理员审核。
          </p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
          <Button type="submit" variant={requestType === 'delete' ? 'danger' : 'primary'}>提交申请</Button>
        </div>
      </form>
    </Modal>
  );
}
