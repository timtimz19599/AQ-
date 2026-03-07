import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Printer } from 'lucide-react';
import type { Course } from '@/types/course';

type ViewMode = 'month' | 'week';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

interface ExportScheduleModalProps {
  viewMode: ViewMode;
  year: number;
  month: number;
  weekStart?: Date;
  onClose: () => void;
}

export function ExportScheduleModal({ viewMode, year, month, weekStart, onClose }: ExportScheduleModalProps) {
  const courses = useCourseStore(s => s.courses);
  const getAllUsers = useAuthStore(s => s.getAllUsers);
  const getTeacherColor = useSettingsStore(s => s.getTeacherColor);
  const allUsers = getAllUsers();
  function displayName(username: string) {
    return allUsers.find(u => u.username === username)?.displayName ?? username;
  }

  function getWeekDays(): { date: string; label: string; weekdayIdx: number; courses: Course[] }[] {
    if (!weekStart) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayCourses = courses
        .filter(c => c.date === dateStr && c.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { date: dateStr, label: `${d.getMonth() + 1}/${d.getDate()}`, weekdayIdx: i, courses: dayCourses };
    });
  }

  function buildMonthWeeks(): (string | null)[][] {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks: (string | null)[][] = [];
    let current: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      current.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      if (current.length === 7) { weeks.push(current); current = []; }
    }
    if (current.length > 0) {
      while (current.length < 7) current.push(null);
      weeks.push(current);
    }
    return weeks;
  }

  async function handlePrint() {
    // Fetch logo and convert to base64 so it works in popup window
    let logoSrc = '';
    try {
      const res = await fetch('/logo.png');
      const blob = await res.blob();
      logoSrc = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { /* logo optional */ }

    const todayStr = new Date().toISOString().split('T')[0];
    const exportTime = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    const title = viewMode === 'month'
      ? `${year}年 ${MONTH_NAMES[month - 1]} 课表`
      : (() => {
          if (!weekStart) return '周课表';
          const end = new Date(weekStart); end.setDate(end.getDate() + 6);
          return `${weekStart.getFullYear()}年${weekStart.getMonth()+1}月${weekStart.getDate()}日–${end.getMonth()+1}月${end.getDate()}日 周课表`;
        })();

    // Build course card HTML helper
    function courseCardHtml(c: Course): string {
      const color = getTeacherColor(c.teacher);
      const isOnline = c.mode === 'online';
      const isPending = c.date < todayStr && c.status !== 'completed' && c.status !== 'cancelled';
      const isCompleted = c.status === 'completed';
      let bg = color;
      if (isCompleted) bg = '#94a3b8';
      if (isPending) bg = '#f59e0b';
      const teacher = displayName(c.teacher);
      const coTeacherNames = (c.coTeachers ?? []).map(displayName);
      const allTeachers = [teacher, ...coTeacherNames].join('、');

      return `<div style="background:${bg};color:#fff;border-radius:6px;padding:6px 8px;margin-bottom:4px;font-size:11px;line-height:1.5;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;opacity:0.85;margin-bottom:1px;">${c.startTime} – ${c.endTime}</div>
            <div style="font-weight:700;font-size:12px;">${c.teamName}</div>
            <div style="font-size:10px;opacity:0.9;">${c.courseName}</div>
            <div style="font-size:10px;opacity:0.75;margin-top:1px;">教师：${allTeachers}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;shrink:0;">
            ${isOnline ? '<span style="background:rgba(245,158,11,0.85);border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;white-space:nowrap;">线上</span>' : '<span style="background:rgba(255,255,255,0.2);border-radius:3px;padding:1px 5px;font-size:9px;font-weight:600;white-space:nowrap;">线下</span>'}
            ${isCompleted ? '<span style="background:rgba(255,255,255,0.25);border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;">✓ 完成</span>' : ''}
            ${isPending ? '<span style="background:rgba(255,255,255,0.25);border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;">待确认</span>' : ''}
          </div>
        </div>
      </div>`;
    }

    let bodyHtml = '';

    if (viewMode === 'month') {
      const weeks = buildMonthWeeks();
      bodyHtml = `
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
  <thead>
    <tr>
      ${WEEKDAY_NAMES.map(d => `<th style="background:#f1f5f9;color:#64748b;font-size:12px;font-weight:600;padding:8px 6px;border:1px solid #e2e8f0;text-align:center;">${d}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${weeks.map(week => `<tr>${week.map(dateStr => {
      if (!dateStr) return `<td style="border:1px solid #e2e8f0;background:#f8fafc;min-height:80px;"></td>`;
      const dayNum = parseInt(dateStr.split('-')[2]);
      const isToday = dateStr === todayStr;
      const dayCourses = courses
        .filter(c => c.date === dateStr && c.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return `<td style="border:1px solid #e2e8f0;vertical-align:top;padding:5px;min-height:90px;${isToday ? 'background:#eff6ff;' : ''}">
        <div style="text-align:center;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;${isToday ? 'background:#1e3a5f;color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;' : 'color:#64748b;'}">${dayNum}</span>
        </div>
        ${dayCourses.map(courseCardHtml).join('')}
      </td>`;
    }).join('')}</tr>`).join('')}
  </tbody>
</table>`;
    } else {
      const weekDays = getWeekDays();
      bodyHtml = `
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
  <thead>
    <tr>
      ${weekDays.map(d => {
        const isToday = d.date === todayStr;
        return `<th style="background:#f1f5f9;padding:10px 6px;border:1px solid #e2e8f0;text-align:center;">
          <div style="font-size:11px;font-weight:600;color:#64748b;">周${WEEKDAY_NAMES[d.weekdayIdx]}</div>
          <div style="font-size:16px;font-weight:800;${isToday ? 'color:#1e3a5f;' : 'color:#0f172a;'}">${d.label.split('/')[1]}</div>
          <div style="font-size:10px;color:#94a3b8;">${d.label.split('/')[0]}月</div>
        </th>`;
      }).join('')}
    </tr>
  </thead>
  <tbody>
    <tr>
      ${weekDays.map(d => {
        const isToday = d.date === todayStr;
        return `<td style="border:1px solid #e2e8f0;vertical-align:top;padding:6px;min-height:120px;${isToday ? 'background:#eff6ff;' : ''}">
          ${d.courses.length === 0
            ? '<div style="color:#cbd5e1;font-size:11px;text-align:center;padding:12px 0;">—</div>'
            : d.courses.map(courseCardHtml).join('')
          }
        </td>`;
      }).join('')}
    </tr>
  </tbody>
</table>`;
    }

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #fff; color: #0f172a; }
  @page { margin: 15mm; size: A4 landscape; }
  @media print { body { padding: 0; } .no-print { display: none !important; } }
</style>
</head>
<body>
<div style="padding: 28px 32px;">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1e3a5f;">
    <div style="display:flex;align-items:center;gap:16px;">
      ${logoSrc ? `<img src="${logoSrc}" style="height:52px;width:auto;object-fit:contain;" alt="AQ Logo" />` : ''}
      <div>
        <div style="font-size:22px;font-weight:800;color:#1e3a5f;letter-spacing:-0.3px;">${title}</div>
        <div style="font-size:12px;color:#64748b;margin-top:3px;">Alpha Quants 排课管理系统</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#94a3b8;">导出时间</div>
      <div style="font-size:13px;font-weight:600;color:#1e3a5f;margin-top:2px;">${exportTime}</div>
    </div>
  </div>

  <!-- Schedule table -->
  ${bodyHtml}

  <!-- Footer -->
  <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#94a3b8;">由 Alpha Quants 排课系统自动生成</div>
    <div style="font-size:10px;color:#94a3b8;">已取消的课程不在此显示</div>
  </div>
</div>

<div class="no-print" style="position:fixed;bottom:24px;right:24px;">
  <button onclick="window.print()" style="background:#1e3a5f;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
    打印 / 保存为 PDF
  </button>
</div>
</body>
</html>`);
    win.document.close();
  }

  // Preview data
  const todayStr = new Date().toISOString().split('T')[0];
  const monthWeeks = viewMode === 'month' ? buildMonthWeeks() : [];
  const weekDays = viewMode === 'week' ? getWeekDays() : [];

  return (
    <Modal title="导出课表" onClose={onClose} width="max-w-4xl">
      <div className="flex flex-col gap-4">

        {/* Preview */}
        <div className="border border-[#e2e8f0] rounded-xl overflow-auto max-h-[55vh] bg-white">
          <div className="sticky top-0 bg-white px-3 py-2 border-b border-[#e2e8f0] text-xs font-semibold text-[#64748b]">
            预览
          </div>
          <div className="p-3">
            {viewMode === 'month' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {WEEKDAY_NAMES.map(d => (
                      <th key={d} style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 600, padding: '6px 4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthWeeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((dateStr, di) => {
                        if (!dateStr) return <td key={di} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: 80 }} />;
                        const dayNum = parseInt(dateStr.split('-')[2]);
                        const isToday = dateStr === todayStr;
                        const dayCourses = courses
                          .filter(c => c.date === dateStr && c.status !== 'cancelled')
                          .sort((a, b) => a.startTime.localeCompare(b.startTime));
                        return (
                          <td key={di} style={{ border: '1px solid #e2e8f0', verticalAlign: 'top', padding: 4, minHeight: 80, background: isToday ? '#eff6ff' : undefined }}>
                            <div style={{ textAlign: 'center', marginBottom: 3 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                background: isToday ? '#1e3a5f' : 'transparent',
                                color: isToday ? 'white' : '#64748b',
                                borderRadius: '50%', width: 20, height: 20,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              }}>{dayNum}</span>
                            </div>
                            {dayCourses.map(c => {
                              const color = getTeacherColor(c.teacher);
                              const isPending = c.date < todayStr && c.status !== 'completed' && c.status !== 'cancelled';
                              const isCompleted = c.status === 'completed';
                              const bg = isCompleted ? '#94a3b8' : isPending ? '#f59e0b' : color;
                              return (
                                <div key={c.id} style={{ background: bg, color: '#fff', borderRadius: 4, padding: '3px 5px', marginBottom: 3, fontSize: 10, lineHeight: 1.4 }}>
                                  <div style={{ fontWeight: 700, fontSize: 10 }}>{c.teamName}</div>
                                  <div style={{ opacity: 0.9 }}>{c.courseName}</div>
                                  <div style={{ opacity: 0.75 }}>{c.startTime}–{c.endTime} · {displayName(c.teacher)}</div>
                                  <div style={{ opacity: 0.8, fontSize: 9 }}>{c.mode === 'online' ? '线上' : '线下'}</div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {weekDays.map(d => (
                      <th key={d.date} style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, fontWeight: 600, padding: '6px 4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div>周{WEEKDAY_NAMES[d.weekdayIdx]}</div>
                        <div style={{ color: d.date === todayStr ? '#1e3a5f' : '#0f172a', fontWeight: d.date === todayStr ? 800 : 600, fontSize: 15 }}>
                          {d.label.split('/')[1]}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.label.split('/')[0]}月</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weekDays.map(d => (
                      <td key={d.date} style={{ border: '1px solid #e2e8f0', verticalAlign: 'top', padding: 4, minHeight: 100, background: d.date === todayStr ? '#eff6ff' : undefined }}>
                        {d.courses.length === 0 ? (
                          <div style={{ color: '#cbd5e1', fontSize: 10, textAlign: 'center', paddingTop: 10 }}>—</div>
                        ) : d.courses.map(c => {
                          const color = getTeacherColor(c.teacher);
                          const isPending = c.date < todayStr && c.status !== 'completed' && c.status !== 'cancelled';
                          const isCompleted = c.status === 'completed';
                          const bg = isCompleted ? '#94a3b8' : isPending ? '#f59e0b' : color;
                          return (
                            <div key={c.id} style={{ background: bg, color: '#fff', borderRadius: 4, padding: '3px 5px', marginBottom: 3, fontSize: 10, lineHeight: 1.4 }}>
                              <div style={{ fontWeight: 700 }}>{c.teamName}</div>
                              <div style={{ opacity: 0.9 }}>{c.courseName}</div>
                              <div style={{ opacity: 0.8 }}>{c.startTime}–{c.endTime}</div>
                              <div style={{ opacity: 0.75, fontSize: 9 }}>{displayName(c.teacher)} · {c.mode === 'online' ? '线上' : '线下'}</div>
                            </div>
                          );
                        })}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="text-xs text-[#64748b] bg-[#f8fafc] rounded-lg px-3 py-2 border border-[#e2e8f0]">
          导出后在浏览器打印对话框中，将「目标」选为「另存为 PDF」，横向打印效果更佳。
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>关闭</Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5 inline-block" />打印 / 保存为 PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
