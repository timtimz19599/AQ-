import { useState, useMemo } from 'react';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { calcDurationMinutes } from '@/utils/timeUtils';
import { downloadCSV } from '@/utils/csvExport';
import { Button } from '@/components/common/Button';
import { DonutChart } from '@/components/common/DonutChart';
import { TrendingUp, TrendingDown, Minus, Wifi, MapPin, Clock } from 'lucide-react';

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

function hStr(mins: number) { return (mins / 60).toFixed(1) + 'h'; }

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-[#64748b]">
      <Minus className="w-2.5 h-2.5" />持平
    </span>
  );
  const up = delta > 0;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {up ? '+' : ''}{hStr(delta)}
    </span>
  );
}

export function StatisticsTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const allCourses = useCourseStore(s => s.courses);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);

  // Last month reference
  const lastMonthDate = useMemo(() => new Date(year, month - 2, 1), [year, month]);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth() + 1;

  // Filter helpers
  const thisPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const lastPrefix = `${lastYear}-${String(lastMonth).padStart(2, '0')}`;

  const thisCourses = useMemo(() => allCourses.filter(c => c.date.startsWith(thisPrefix)), [allCourses, thisPrefix]);
  const lastCourses = useMemo(() => allCourses.filter(c => c.date.startsWith(lastPrefix)), [allCourses, lastPrefix]);

  // Only count approved teachers
  const approvedUsernames = useMemo(() => {
    const users = getAllUsers();
    return new Set(users.filter(u => u.approved).map(u => u.username));
  }, [getAllUsers]);

  // Compute per-teacher stats for a course list (approved only)
  function buildStats(courseList: typeof allCourses) {
    const users = getAllUsers();
    const map = new Map<string, { displayName: string; teacherType: string; count: number; onlineMins: number; offlineMins: number }>();
    for (const c of courseList) {
      if (!approvedUsernames.has(c.teacher)) continue;
      if (!map.has(c.teacher)) {
        const u = users.find(u => u.username === c.teacher);
        map.set(c.teacher, { displayName: u?.displayName ?? c.teacher, teacherType: u?.teacherType ?? 'lead', count: 0, onlineMins: 0, offlineMins: 0 });
      }
      const e = map.get(c.teacher)!;
      const mins = calcDurationMinutes(c.startTime, c.endTime);
      e.count += 1;
      if ((c.mode ?? 'offline') === 'online') e.onlineMins += mins;
      else e.offlineMins += mins;
    }
    const rows = Array.from(map.entries()).map(([username, e]) => ({
      username, ...e, totalMins: e.onlineMins + e.offlineMins,
    })).sort((a, b) => b.totalMins - a.totalMins);
    const totalMins = rows.reduce((s, r) => s + r.totalMins, 0);
    const totalOnline = rows.reduce((s, r) => s + r.onlineMins, 0);
    const totalOffline = rows.reduce((s, r) => s + r.offlineMins, 0);
    return { rows, totalMins, totalOnline, totalOffline };
  }

  const thisStats = useMemo(() => buildStats(thisCourses), [thisCourses, approvedUsernames]);
  const lastStats = useMemo(() => buildStats(lastCourses), [lastCourses, approvedUsernames]);

  // All-time per teacher
  const allTimeMins = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of allCourses) {
      map.set(c.teacher, (map.get(c.teacher) ?? 0) + calcDurationMinutes(c.startTime, c.endTime));
    }
    return map;
  }, [allCourses]);

  // Company deltas
  const totalDelta = thisStats.totalMins - lastStats.totalMins;
  const onlineDelta = thisStats.totalOnline - lastStats.totalOnline;
  const offlineDelta = thisStats.totalOffline - lastStats.totalOffline;

  // Donut segments
  const thisSegments = thisStats.rows.map(r => ({ label: r.displayName, value: r.totalMins, color: getTeacherColor(r.username) }));
  const lastSegments = lastStats.rows.map(r => ({ label: r.displayName, value: r.totalMins, color: getTeacherColor(r.username) }));

  const maxMins = Math.max(...thisStats.rows.map(r => r.totalMins), 1);

  function handleExport() {
    const header = ['教师用户名', '显示名称', '排课数', '线上分钟', '线下分钟', '本月合计分钟', '本月合计小时', '历史合计小时', '占比%'];
    const totalMins = thisStats.totalMins;
    const rows = thisStats.rows.map(r => [
      r.username, r.displayName, String(r.count),
      String(r.onlineMins), String(r.offlineMins),
      String(r.totalMins), (r.totalMins / 60).toFixed(1),
      ((allTimeMins.get(r.username) ?? 0) / 60).toFixed(1),
      totalMins > 0 ? (r.totalMins / totalMins * 100).toFixed(1) : '0.0',
    ]);
    downloadCSV(`课时统计_${year}-${String(month).padStart(2, '0')}.csv`, [header, ...rows]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#64748b]">年份</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))}
            className="border border-[#e2e8f0] rounded-lg px-2 py-1 w-20 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#64748b]">月份</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border border-[#e2e8f0] rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#1e3a5f]/40">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}月</option>
            ))}
          </select>
        </div>
        <Button size="sm" variant="secondary" onClick={handleExport}>导出 CSV</Button>
        <Button size="sm" variant="ghost" onClick={() => window.print()}>打印</Button>
      </div>

      {/* Company summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '本月合计课时', icon: <Clock className="w-4 h-4" />, mins: thisStats.totalMins, delta: totalDelta, accent: '#1e3a5f' },
          { label: '线上课时', icon: <Wifi className="w-4 h-4" />, mins: thisStats.totalOnline, delta: onlineDelta, accent: '#0ea5e9' },
          { label: '线下课时', icon: <MapPin className="w-4 h-4" />, mins: thisStats.totalOffline, delta: offlineDelta, accent: '#10b981' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]" style={{ color: card.accent }}>
              {card.icon}
              <span className="font-semibold">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              {(card.mins / 60).toFixed(1)}<span className="text-sm font-normal text-[#64748b] ml-1">h</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
              <span>vs 上月</span>
              <DeltaBadge delta={card.delta} />
            </div>
          </div>
        ))}
      </div>

      {thisStats.rows.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center bg-white rounded-xl border border-[#e2e8f0]">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="8" y="12" width="40" height="36" rx="4" fill="#e2e8f0" />
            <rect x="8" y="12" width="40" height="12" rx="4" fill="#cbd5e1" />
            <rect x="16" y="6" width="4" height="12" rx="2" fill="#94a3b8" />
            <rect x="36" y="6" width="4" height="12" rx="2" fill="#94a3b8" />
          </svg>
          <p className="mt-3 text-[#64748b] text-sm">本月暂无课程数据</p>
        </div>
      ) : (
        <>
          {/* Donut comparison */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
            <h3 className="text-sm font-semibold text-[#1e3a5f] mb-4">教师课时占比 · 本月 vs 上月</h3>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {/* This month */}
              <div className="flex flex-col items-center gap-1">
                <DonutChart segments={thisSegments} size={170} title={`${year}年${MONTH_NAMES[month - 1]}`} showLegend={false} />
              </div>

              {/* VS divider */}
              <div className="flex flex-col items-center gap-2 px-2">
                <div className="text-xs font-bold text-[#94a3b8] tracking-widest">VS</div>
                <div className="flex flex-col items-center gap-1.5 mt-1">
                  <DeltaBadge delta={totalDelta} />
                  <span className="text-[9px] text-[#94a3b8]">总课时变化</span>
                </div>
              </div>

              {/* Last month */}
              <div className="flex flex-col items-center gap-1">
                {lastStats.rows.length > 0
                  ? <DonutChart segments={lastSegments} size={170} title={`${lastYear}年${MONTH_NAMES[lastMonth - 1]}`} showLegend={false} />
                  : (
                    <div className="w-[170px] h-[170px] flex items-center justify-center text-xs text-[#94a3b8]">
                      上月暂无数据
                    </div>
                  )
                }
              </div>
            </div>

            {/* Shared legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-[#e2e8f0]">
              {thisSegments.map((seg, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span>{seg.label}</span>
                  <span className="text-slate-400">({(seg.value / thisStats.totalMins * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <h3 className="text-sm font-semibold text-[#1e3a5f]">教师明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">教师</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-[#64748b] uppercase tracking-wide">类型</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-sky-600 uppercase tracking-wide">
                      <span className="flex items-center justify-end gap-1"><Wifi className="w-3 h-3" />线上</span>
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                      <span className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3" />线下</span>
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wide">本月合计</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wide">历史合计</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide w-36">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {thisStats.rows.map((r, i) => {
                    const color = getTeacherColor(r.username);
                    const pct = (r.totalMins / maxMins) * 100;
                    const pctStr = thisStats.totalMins > 0 ? (r.totalMins / thisStats.totalMins * 100).toFixed(1) : '0.0';
                    const allTime = allTimeMins.get(r.username) ?? 0;
                    const isLead = r.teacherType === 'lead';
                    return (
                      <tr key={r.username} className={`border-b border-[#e2e8f0] ${i % 2 === 1 ? 'bg-[#f8fafc]/60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-medium text-[#0f172a]">{r.displayName}</span>
                            <span className="text-[#94a3b8] text-xs">@{r.username}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isLead ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' : 'bg-amber-100 text-amber-700'}`}>
                            {isLead ? '主教' : '助教'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sky-700 font-medium">{(r.onlineMins / 60).toFixed(1)}h</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-emerald-700 font-medium">{(r.offlineMins / 60).toFixed(1)}h</span>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-[#0f172a]">
                          {(r.totalMins / 60).toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-right text-[#64748b]">
                          {(allTime / 60).toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs text-[#64748b] w-10 text-right shrink-0">{pctStr}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* Lead subtotal */}
                  {(() => {
                    const leadRows = thisStats.rows.filter(r => r.teacherType === 'lead');
                    const asstRows = thisStats.rows.filter(r => r.teacherType !== 'lead');
                    const leadMins = leadRows.reduce((s, r) => s + r.totalMins, 0);
                    const asstMins = asstRows.reduce((s, r) => s + r.totalMins, 0);
                    const leadOnline = leadRows.reduce((s, r) => s + r.onlineMins, 0);
                    const asstOnline = asstRows.reduce((s, r) => s + r.onlineMins, 0);
                    const leadOffline = leadRows.reduce((s, r) => s + r.offlineMins, 0);
                    const asstOffline = asstRows.reduce((s, r) => s + r.offlineMins, 0);
                    return (
                      <>
                        {leadRows.length > 0 && (
                          <tr className="border-t border-[#e2e8f0] bg-[#1e3a5f]/3">
                            <td className="px-4 py-2.5 font-semibold text-[#1e3a5f] text-xs">主教小计</td>
                            <td />
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-sky-700">{(leadOnline / 60).toFixed(1)}h</td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-700">{(leadOffline / 60).toFixed(1)}h</td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-[#0f172a]">{(leadMins / 60).toFixed(1)}h</td>
                            <td colSpan={2} />
                          </tr>
                        )}
                        {asstRows.length > 0 && (
                          <tr className="border-t border-[#e2e8f0] bg-amber-50/50">
                            <td className="px-4 py-2.5 font-semibold text-amber-700 text-xs">助教小计</td>
                            <td />
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-sky-700">{(asstOnline / 60).toFixed(1)}h</td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-700">{(asstOffline / 60).toFixed(1)}h</td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-[#0f172a]">{(asstMins / 60).toFixed(1)}h</td>
                            <td colSpan={2} />
                          </tr>
                        )}
                      </>
                    );
                  })()}
                  {/* Company total */}
                  <tr className="bg-[#1e3a5f]/5 border-t-2 border-[#1e3a5f]/20">
                    <td className="px-4 py-3 font-bold text-[#1e3a5f] text-sm">公司合计</td>
                    <td />
                    <td className="px-3 py-3 text-right font-bold text-sky-700">
                      {(thisStats.totalOnline / 60).toFixed(1)}h
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-700">
                      {(thisStats.totalOffline / 60).toFixed(1)}h
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#0f172a]">
                      {(thisStats.totalMins / 60).toFixed(1)}h
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#64748b]">
                      {(Array.from(allTimeMins.values()).reduce((s, v) => s + v, 0) / 60).toFixed(1)}h
                    </td>
                    <td className="px-4 py-3">
                      <DeltaBadge delta={totalDelta} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
