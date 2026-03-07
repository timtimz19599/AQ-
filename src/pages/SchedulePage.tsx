import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCourseStore } from '@/store/courseStore';
import { useMonthGrid } from '@/hooks/useMonthGrid';
import { useWeekGrid } from '@/hooks/useWeekGrid';
import { MonthGrid } from '@/components/schedule/MonthGrid';
import { WeekGrid } from '@/components/schedule/WeekGrid';
import { MonthNavigator, type ViewMode } from '@/components/schedule/MonthNavigator';
import { AddCourseModal } from '@/components/modals/AddCourseModal';
import { CourseDetailModal } from '@/components/modals/CourseDetailModal';
import { AdminCourseModal } from '@/components/admin/AdminCourseModal';
import { calcDurationMinutes } from '@/utils/timeUtils';
import { Clock, CalendarDays, TrendingUp, TrendingDown, Minus, Bell, Pencil, LogOut, AlertCircle, Users } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Week navigation: start on Sunday of current week
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const users = useAuthStore(s => s.users);
  const filterUsername = session?.role === 'teacher' ? session.username : undefined;
  const approvedUsernames = useMemo(() => {
    if (session?.role !== 'admin') return undefined;
    return users.filter(u => u.approved).map(u => u.username);
  }, [session, users]);
  const weeks = useMonthGrid(year, month, filterUsername, approvedUsernames);
  const weekDays = useWeekGrid(weekStart, filterUsername, approvedUsernames);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }
  function prevWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  function nextWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
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

    // 已授课时：只计 completed
    const taughtMins = thisMonthCourses
      .filter(c => c.status === 'completed')
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // 待授课时：未来且未取消
    const remainingMins = thisMonthCourses
      .filter(c => c.status !== 'cancelled' && (c.date > todayStr || (c.date === todayStr && c.startTime > nowTimeStr)))
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // 本月总：已完成 + 待上（非取消），用于进度条分母
    const thisMonthTotalMins = thisMonthCourses
      .filter(c => c.status !== 'cancelled')
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // Last month: 只计 completed
    const lastMonthMins = myCourses
      .filter(c => c.date.startsWith(lastMonthPrefix) && c.status === 'completed')
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // All time: 只计 completed
    const totalMins = myCourses
      .filter(c => c.status === 'completed')
      .reduce((s, c) => s + calcDurationMinutes(c.startTime, c.endTime), 0);

    // Next upcoming course (future, not cancelled, sorted)
    const next = myCourses
      .filter(c => c.status !== 'cancelled' && (c.date > todayStr || (c.date === todayStr && c.startTime > nowTimeStr)))
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

            {/* Pending confirmation courses */}
            {(() => {
              const pending = courses
                .filter(c =>
                  c.teacher === session?.username &&
                  c.date < todayStr &&
                  c.status !== 'completed' &&
                  c.status !== 'cancelled'
                )
                .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
              if (pending.length === 0) return null;
              return (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      待确认 {pending.length} 节
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {pending.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className="w-full text-left bg-white rounded-lg px-2 py-1.5 border border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 transition-colors"
                      >
                        <div className="text-xs font-semibold text-amber-800 truncate">{c.teamName}</div>
                        <div className="text-[10px] text-amber-600 truncate">{c.date} · {c.startTime}–{c.endTime}</div>
                        <div className="text-[10px] text-amber-500 mt-0.5">点击提交课堂反馈</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

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

        {/* Admin sidebar content */}
        {session?.role === 'admin' && (() => {
          const thisPrefix = `${realYear}-${String(realMonth).padStart(2, '0')}`;
          const allUsers = users;
          const approvedTeachers = allUsers.filter(u => u.approved && u.role === 'teacher');

          // 本月已完成课时 per teacher
          const teacherMinsMap = new Map<string, number>();
          for (const c of courses) {
            if (c.status !== 'completed') continue;
            if (!c.date.startsWith(thisPrefix)) continue;
            teacherMinsMap.set(c.teacher, (teacherMinsMap.get(c.teacher) ?? 0) + calcDurationMinutes(c.startTime, c.endTime));
          }
          const maxMins = Math.max(...Array.from(teacherMinsMap.values()), 1);

          // 未确认课程：日期已过但仍为 scheduled
          const unconfirmed = courses
            .filter(c => (!c.status || c.status === 'scheduled') && c.date < todayStr)
            .sort((a, b) => b.date.localeCompare(a.date));

          return (
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3">
              {/* 本月课时 */}
              <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
                  <Clock className="w-4 h-4 text-[#1e3a5f]" />
                  <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                    {realYear}年{realMonth}月课时
                  </span>
                </div>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  {approvedTeachers.length === 0 ? (
                    <p className="text-xs text-[#94a3b8]">暂无教师</p>
                  ) : approvedTeachers.map(u => {
                    const mins = teacherMinsMap.get(u.username) ?? 0;
                    const color = getTeacherColor(u.username);
                    const pct = (mins / maxMins) * 100;
                    return (
                      <div key={u.username} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-xs font-medium text-[#0f172a] truncate">{u.displayName}</span>
                          </div>
                          <span className="text-xs font-semibold text-[#1e3a5f] shrink-0 ml-1">
                            {(mins / 60).toFixed(1)}h
                          </span>
                        </div>
                        <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 未确认课程 */}
              <div className={`rounded-xl border ${unconfirmed.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className={`w-4 h-4 ${unconfirmed.length > 0 ? 'text-amber-600' : 'text-[#1e3a5f]'}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${unconfirmed.length > 0 ? 'text-amber-700' : 'text-[#1e3a5f]'}`}>
                      未确认课程
                    </span>
                  </div>
                  {unconfirmed.length > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">
                      {unconfirmed.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 px-3 pb-3 max-h-52 overflow-y-auto">
                  {unconfirmed.length === 0 ? (
                    <p className="text-xs text-[#94a3b8]">全部已确认 ✓</p>
                  ) : unconfirmed.map(c => {
                    const teacherUser = allUsers.find(u => u.username === c.teacher);
                    const color = getTeacherColor(c.teacher);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className="w-full text-left bg-white rounded-lg px-2 py-1.5 border border-amber-200 hover:border-amber-400 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs font-medium text-[#0f172a] truncate">{c.courseName}</span>
                        </div>
                        <p className="text-[10px] text-amber-600 pl-3.5 mt-0.5">
                          {c.date} · {teacherUser?.displayName ?? c.teacher}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 教师总人数 */}
              <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#1e3a5f]" />
                  <span className="text-xs text-[#64748b]">已审批教师</span>
                </div>
                <span className="text-sm font-bold text-[#1e3a5f]">{approvedTeachers.length} 人</span>
              </div>
            </div>
          );
        })()}

        {/* Guest sidebar content */}
        {!session && (
          <div className="flex-1 p-3" />
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
            onPrev={viewMode === 'month' ? prevMonth : prevWeek}
            onNext={viewMode === 'month' ? nextMonth : nextWeek}
            onAddCourse={() => setShowAddModal(true)}
            viewMode={viewMode}
            onViewChange={setViewMode}
            weekStart={weekStart}
          />
          {viewMode === 'month' ? (
            <MonthGrid weeks={weeks} onCourseClick={setSelectedCourseId} />
          ) : (
            <WeekGrid days={weekDays} onCourseClick={setSelectedCourseId} />
          )}
        </div>
      </main>

      {showAddModal && session?.role === 'admin' && (
        <AdminCourseModal onClose={() => setShowAddModal(false)} />
      )}
      {showAddModal && session?.role === 'teacher' && (
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
