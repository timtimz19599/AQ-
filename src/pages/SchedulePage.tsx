import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCourseStore } from '@/store/courseStore';
import { useMonthGrid } from '@/hooks/useMonthGrid';
import { MonthGrid } from '@/components/schedule/MonthGrid';
import { MonthNavigator } from '@/components/schedule/MonthNavigator';
import { AddCourseModal } from '@/components/modals/AddCourseModal';
import { CourseDetailModal } from '@/components/modals/CourseDetailModal';
import { calcDurationMinutes } from '@/utils/timeUtils';
import { Clock, CalendarDays, TrendingUp, TrendingDown, Minus, Bell, Pencil, LogOut, AlertCircle } from 'lucide-react';
import { ProfileModal } from '@/components/modals/ProfileModal';

export function SchedulePage() {
  const navigate = useNavigate();
  const session = useAuthStore(s => s.session);
  const logout = useAuthStore(s => s.logout);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const courses = useCourseStore(s => s.courses);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const users = useAuthStore(s => s.users);
  const filterUsername = session?.role === 'teacher' ? session.username : undefined;
  const approvedUsernames = useMemo(() => {
    if (session?.role !== 'admin') return undefined;
    return users.filter(u => u.approved).map(u => u.username);
  }, [session, users]);
  const weeks = useMonthGrid(year, month, filterUsername, approvedUsernames);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const todayStr = today.toISOString().split('T')[0];
  const nowTimeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  // Stats always based on the REAL current month
  const realYear = today.getFullYear();
  const realMonth = today.getMonth() + 1;
  const realMonthPrefix = `${realYear}-${String(realMonth).padStart(2, '0')}`;
  const lastMonthDate = new Date(realYear, realMonth - 2, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const teacherStats = useMemo(() => {
    if (!session || session.role !== 'teacher') return null;
    const username = session.username;
    const myCourses = courses.filter(c => c.teacher === username);

    // This month
    const thisMonthCourses = myCourses.filter(c => c.date.startsWith(realMonthPrefix));

    const taughtMins = thisMonthCourses
      .filter(c => c.date < todayStr || (c.date === todayStr && c.endTime <= nowTimeStr))
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    const remainingMins = thisMonthCourses
      .filter(c => c.date > todayStr || (c.date === todayStr && c.startTime > nowTimeStr))
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    const thisMonthTotalMins = thisMonthCourses.reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // Last month
    const lastMonthMins = myCourses
      .filter(c => c.date.startsWith(lastMonthPrefix))
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // All time
    const totalMins = myCourses.reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // Next upcoming course (future, sorted)
    const next = myCourses
      .filter(c => c.date > todayStr || (c.date === todayStr && c.startTime > nowTimeStr))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] ?? null;

    const diffMins = thisMonthTotalMins - lastMonthMins;
    const taughtPct = thisMonthTotalMins > 0 ? (taughtMins / thisMonthTotalMins) * 100 : 0;

    return {
      taughtH: (taughtMins / 60).toFixed(1),
      remainingH: (remainingMins / 60).toFixed(1),
      thisMonthH: (thisMonthTotalMins / 60).toFixed(1),
      lastMonthH: (lastMonthMins / 60).toFixed(1),
      totalH: (totalMins / 60).toFixed(1),
      diffH: (Math.abs(diffMins) / 60).toFixed(1),
      diffSign: diffMins > 0 ? '+' : diffMins < 0 ? '-' : '=',
      taughtPct,
      next,
      color: getTeacherColor(username),
    };
  }, [courses, session, todayStr, nowTimeStr, realMonthPrefix, lastMonthPrefix, getTeacherColor]);

  const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

  return (
    <div className="h-screen bg-[#f8fafc] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-[#e2e8f0] flex flex-col shadow-sm h-screen">

        {/* Header */}
        <div className="bg-gradient-to-b from-[#1e3a5f] to-[#162d4a] px-3 pt-4 pb-4">
          {/* Logo — full-width, minimal padding to zoom in */}
          <div
            className="rounded-xl px-1 py-1 mb-3 w-full"
            style={{
              background: 'rgba(255,255,255,0.97)',
              boxShadow: '0 0 28px rgba(96,165,250,0.25), 0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <img src="/logo.png" alt="AQ" className="h-20 w-full object-contain" />
          </div>

          {/* Gold divider */}
          <div className="flex items-center gap-2 justify-center mb-3">
            <div className="h-px flex-1" style={{ background: 'rgba(147,197,253,0.2)' }} />
            <div className="w-8 h-0.5 rounded-full bg-[#f59e0b]" />
            <div className="h-px flex-1" style={{ background: 'rgba(147,197,253,0.2)' }} />
          </div>

          {/* User info */}
          {session && (
            <div className="flex items-center gap-2">
              {teacherStats && (
                <span className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/30"
                  style={{ backgroundColor: teacherStats.color }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white/90 text-sm font-semibold truncate">{session.displayName}</div>
                <div className="text-white/50 text-xs">{session.role === 'admin' ? '管理员' : '教师'}</div>
              </div>
              {session.role === 'teacher' && (
                <button onClick={() => setShowProfile(true)}
                  className="text-white/50 hover:text-white/90 transition-colors shrink-0"
                  title="编辑个人资料">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav links */}
        {session?.role === 'admin' && (
          <div className="px-3 py-2.5 border-b border-[#e2e8f0]">
            <Link to="/admin" className="text-sm text-[#1e3a5f] hover:underline font-medium">管理面板</Link>
          </div>
        )}

        {/* Pending approval banner */}
        {session?.role === 'teacher' && session.approved === false && (
          <div className="mx-3 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700">账号待审批</p>
              <p className="text-[11px] text-amber-600 leading-relaxed mt-0.5">
                您的课程已保存，待管理员审批通过后将正式计入排课表。
              </p>
            </div>
          </div>
        )}

        {/* Teacher personal dashboard */}
        {teacherStats && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3">

            {/* This month hours */}
            <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-[#1e3a5f]" />
                <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                  {realYear}年 {MONTH_NAMES[realMonth - 1]}课时
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs text-[#64748b]">已授课</span>
                  <span className="text-xl font-bold text-[#0f172a] leading-tight">{teacherStats.taughtH}<span className="text-sm font-normal text-[#64748b] ml-0.5">h</span></span>
                </div>
                <div className="w-px bg-[#e2e8f0]" />
                <div className="flex flex-col items-end">
                  <span className="text-xs text-[#64748b]">待授课</span>
                  <span className="text-xl font-bold text-[#f59e0b] leading-tight">{teacherStats.remainingH}<span className="text-sm font-normal text-[#64748b] ml-0.5">h</span></span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${teacherStats.taughtPct}%`, backgroundColor: teacherStats.color }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[#64748b]">已上 {teacherStats.taughtPct.toFixed(0)}%</span>
                <span className="text-[10px] text-[#64748b]">共 {teacherStats.thisMonthH}h</span>
              </div>
            </div>

            {/* Next course */}
            <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 mb-2">
                <Bell className="w-4 h-4 text-[#1e3a5f]" />
                <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">下次课程</span>
              </div>
              {teacherStats.next ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="text-sm font-semibold text-[#0f172a]">{teacherStats.next.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="text-sm text-[#0f172a]">{teacherStats.next.startTime} – {teacherStats.next.endTime}</span>
                  </div>
                  <div className="mt-1 bg-white rounded-lg px-2 py-1.5 border border-[#e2e8f0]">
                    <div className="text-xs text-[#64748b] truncate">{teacherStats.next.teamName}</div>
                    <div className="text-sm font-medium text-[#0f172a] truncate">{teacherStats.next.courseName}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#64748b]">暂无待上课程</p>
              )}
            </div>

            {/* Total stats */}
            <div className="bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-[#1e3a5f]" />
                <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">累计统计</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">累计课时</span>
                  <span className="text-base font-bold text-[#0f172a]">{teacherStats.totalH}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">上月课时</span>
                  <span className="text-base text-[#64748b]">{teacherStats.lastMonthH}h</span>
                </div>
                <div className="h-px bg-[#e2e8f0]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">较上月</span>
                  <div className="flex items-center gap-1">
                    {teacherStats.diffSign === '+' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                    {teacherStats.diffSign === '-' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                    {teacherStats.diffSign === '=' && <Minus className="w-3.5 h-3.5 text-[#64748b]" />}
                    <span className={`text-sm font-bold ${
                      teacherStats.diffSign === '+' ? 'text-emerald-600' :
                      teacherStats.diffSign === '-' ? 'text-red-500' : 'text-[#64748b]'
                    }`}>
                      {teacherStats.diffSign === '=' ? '持平' : `${teacherStats.diffSign}${teacherStats.diffH}h`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin / guest sidebar content */}
        {(!session || session.role === 'admin') && (
          <div className="flex-1 p-3 flex flex-col gap-2">
            {session?.role === 'admin' && (
              <p className="text-xs text-[#64748b] leading-relaxed">
                以管理员身份登录。课时统计数据请前往管理面板查看。
              </p>
            )}
          </div>
        )}

        {/* Bottom logout */}
        <div className="p-3 border-t border-[#e2e8f0]">
          {session ? (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#ef4444] transition-colors group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              退出登录
            </button>
          ) : (
            <Link to="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors">
              登录
            </Link>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto dot-grid">
        <div className="bg-[#f8fafc]/80 rounded-xl p-4">
          <MonthNavigator
            year={year} month={month}
            onPrev={prevMonth} onNext={nextMonth}
            onAddCourse={() => setShowAddModal(true)}
          />
          <MonthGrid weeks={weeks} onCourseClick={setSelectedCourseId} />
        </div>
      </main>

      {showAddModal && (
        <AddCourseModal
          initialDate={todayStr}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {selectedCourseId && (
        <CourseDetailModal
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
